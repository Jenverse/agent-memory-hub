import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, getServiceRedisClient, RedisKeys } from '../../../lib/redis.js';
import { validateAgainstSchema, createValidationErrorResponse } from '../../../lib/validation.js';
import { extractMemoriesFromConversation, consolidateMemories } from '../../../lib/memory-extraction.js';
import type { StoreShortTermRequest, ServiceConfig, ApiResponse, LongTermMemoryRecord, MemoryType } from '../../../lib/types.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ApiResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { service_id, data } = req.body as StoreShortTermRequest;

    // Validate request
    if (!service_id || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: service_id and data',
      });
    }

    const configRedis = getRedisClient();

    // Get service configuration from global Redis
    const serviceConfig = await configRedis.get<ServiceConfig>(
      RedisKeys.serviceConfig(service_id)
    );

    if (!serviceConfig) {
      return res.status(404).json({
        success: false,
        error: `Service not found: ${service_id}`,
      });
    }

    // Validate data against short-term schema
    const validation = validateAgainstSchema(
      data as any,
      serviceConfig.schemas.shortTermFields
    );

    if (!validation.valid) {
      return res.status(400).json(createValidationErrorResponse(validation.errors));
    }

    // Get service-specific Redis client for storing memory data
    let serviceRedis;
    try {
      serviceRedis = getServiceRedisClient(serviceConfig);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to service Redis',
      });
    }

    // Store in service-specific Redis
    const { session_id } = data;
    const messageKey = RedisKeys.sessionMessages(session_id);
    const metadataKey = RedisKeys.sessionMetadata(session_id);

    // Add message to session
    await serviceRedis.rpush(messageKey, data);

    // Set TTL to 24 hours (86400 seconds)
    await serviceRedis.expire(messageKey, 86400);

    // Store/update session metadata
    await serviceRedis.hset(metadataKey, {
      user_id: data.user_id,
      service_id,
      last_activity: data.timestamp,
    });
    await serviceRedis.expire(metadataKey, 86400);

    // Trigger memory extraction (async, don't block response)
    // For fixed services, default to all 4 memory types if not set
    const defaultMemoryTypes: MemoryType[] = ['user_preferences', 'semantic', 'summary', 'episodic'];
    const memoryTypes = serviceConfig.memoryTypes?.length > 0
      ? serviceConfig.memoryTypes
      : (serviceConfig.serviceType === 'fixed' ? defaultMemoryTypes : []);

    if (memoryTypes.length > 0 && process.env.OPENAI_API_KEY) {
      triggerExtraction(
        serviceRedis,
        configRedis,
        serviceConfig,
        session_id,
        data.user_id,
        memoryTypes as MemoryType[]
      ).catch((err) => console.error('Background extraction error:', err));
    }

    return res.status(200).json({
      success: true,
      data: {
        session_id,
        stored_at: data.timestamp,
      },
    });
  } catch (error) {
    console.error('Error storing short-term memory:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// Background extraction function
async function triggerExtraction(
  serviceRedis: any,
  configRedis: any,
  serviceConfig: ServiceConfig,
  sessionId: string,
  userId: string,
  memoryTypes: MemoryType[]
) {
  try {
    // Get all messages from session
    const messageKey = RedisKeys.sessionMessages(sessionId);
    const messages = await serviceRedis.lrange(messageKey, 0, -1);

    if (!messages || messages.length === 0) {
      return;
    }

    // Extract memories from conversation
    const extractedMemories = await extractMemoriesFromConversation(
      messages,
      memoryTypes,
      userId
    );

    if (extractedMemories.length === 0) {
      return;
    }

    // Get existing memories for this user to consolidate
    const existingMemories: LongTermMemoryRecord[] = [];
    for (const memType of memoryTypes) {
      const memoryKey = RedisKeys.longTermMemory(userId, memType);
      const existing = await serviceRedis.lrange(memoryKey, 0, -1);
      if (existing) {
        existingMemories.push(...existing);
      }
    }

    // Consolidate new memories with existing
    const consolidationResults = await consolidateMemories(extractedMemories, existingMemories);

    // Apply consolidation results
    for (const result of consolidationResults) {
      const memoryKey = RedisKeys.longTermMemory(userId, result.newMemory.memoryType);

      if (result.action === 'add') {
        // Simply add the new memory
        await serviceRedis.rpush(memoryKey, result.newMemory);
      } else if (result.action === 'conflict' && result.conflictingMemoryId) {
        // Delete old conflicting memory, add new one
        // Find and remove the conflicting memory
        const allMemories = await serviceRedis.lrange(memoryKey, 0, -1) as LongTermMemoryRecord[];
        const filtered = allMemories.filter(
          (m) => m.memoryRecordId !== result.conflictingMemoryId
        );
        // Replace the list
        await serviceRedis.del(memoryKey);
        for (const m of filtered) {
          await serviceRedis.rpush(memoryKey, m);
        }
        // Add the new memory
        await serviceRedis.rpush(memoryKey, result.newMemory);
      }
      // 'skip' action: do nothing
    }

    console.log(`Extracted ${consolidationResults.filter(r => r.action !== 'skip').length} memories for user ${userId}`);
  } catch (error) {
    console.error('Error in background extraction:', error);
  }
}

