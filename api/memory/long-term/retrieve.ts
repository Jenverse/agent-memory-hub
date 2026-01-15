import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, getServiceRedisClient, RedisKeys } from '../../../lib/redis.js';
import type { LongTermMemoryRecord, ServiceConfig, ApiResponse, MemoryType } from '../../../lib/types.js';

const ALL_MEMORY_TYPES: MemoryType[] = ['user_preferences', 'semantic', 'summary', 'episodic'];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ApiResponse>
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { user_id, service_id, memory_type } = req.query;

    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: user_id',
      });
    }

    if (!service_id || typeof service_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: service_id',
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

    // Get service-specific Redis client for retrieving memory data
    let serviceRedis;
    try {
      serviceRedis = getServiceRedisClient(serviceConfig);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to service Redis',
      });
    }

    const memories: Record<string, LongTermMemoryRecord[]> = {};

    // Determine which memory types to retrieve
    const memoryTypesToRetrieve = memory_type && typeof memory_type === 'string'
      ? [memory_type as MemoryType]
      : serviceConfig.memoryTypes || ALL_MEMORY_TYPES;

    // Retrieve memories for each memory type
    for (const memType of memoryTypesToRetrieve) {
      const memoryKey = RedisKeys.longTermMemory(user_id, memType);
      const memoryData = await serviceRedis.lrange<LongTermMemoryRecord>(memoryKey, 0, -1);
      memories[memType] = memoryData || [];
    }

    return res.status(200).json({
      success: true,
      data: {
        user_id,
        service_id,
        memories,
      },
    });
  } catch (error) {
    console.error('Error retrieving long-term memory:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

