import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, getServiceRedisClient, RedisKeys } from '../../lib/redis.js';
import { extractMemoriesFromConversation, consolidateMemories } from '../../lib/memory-extraction.js';
import type { ServiceConfig, ApiResponse, LongTermMemoryRecord, MemoryType } from '../../lib/types.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Use POST' });
  }

  const { service_id, session_id, user_id } = req.body;

  if (!service_id || !session_id || !user_id) {
    return res.status(400).json({
      success: false,
      error: 'Missing service_id, session_id, or user_id',
    });
  }

  try {
    const configRedis = getRedisClient();
    const serviceConfig = await configRedis.get<ServiceConfig>(RedisKeys.serviceConfig(service_id));

    if (!serviceConfig) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const serviceRedis = getServiceRedisClient(serviceConfig);
    const messageKey = RedisKeys.sessionMessages(session_id);
    const messages = await serviceRedis.lrange(messageKey, 0, -1);

    const debugInfo: Record<string, any> = {
      step: 'init',
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'NOT_SET',
      messageCount: messages?.length || 0,
      messages: messages || [],
      memoryTypes: serviceConfig.memoryTypes || [],
    };

    if (!messages || messages.length === 0) {
      return res.status(200).json({ success: true, data: { ...debugInfo, error: 'No messages in session' } });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({ success: true, data: { ...debugInfo, error: 'No OpenAI key' } });
    }

    debugInfo.step = 'extracting';
    const memoryTypes: MemoryType[] = ['user_preferences', 'semantic', 'summary', 'episodic'];

    try {
      const extractedMemories = await extractMemoriesFromConversation(messages, memoryTypes, user_id);
      debugInfo.step = 'extracted';
      debugInfo.extractedCount = extractedMemories.length;
      debugInfo.extractedMemories = extractedMemories;

      if (extractedMemories.length > 0) {
        // Store them
        for (const memory of extractedMemories) {
          const memoryKey = RedisKeys.longTermMemory(user_id, memory.memoryType);
          await serviceRedis.rpush(memoryKey, memory);
        }
        debugInfo.step = 'stored';
        debugInfo.storedCount = extractedMemories.length;
      }
    } catch (extractError) {
      debugInfo.extractionError = extractError instanceof Error ? extractError.message : String(extractError);
      debugInfo.extractionStack = extractError instanceof Error ? extractError.stack : undefined;
    }

    return res.status(200).json({ success: true, data: debugInfo });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

