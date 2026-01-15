import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, getServiceRedisClient, RedisKeys } from '../../lib/redis.js';
import type { ServiceConfig, ApiResponse } from '../../lib/types.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { service_id, user_id } = req.query;

  if (!service_id || typeof service_id !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing service_id' });
  }

  try {
    const configRedis = getRedisClient();
    
    // Get service config
    const serviceConfig = await configRedis.get<ServiceConfig>(
      RedisKeys.serviceConfig(service_id)
    );

    if (!serviceConfig) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // Get service Redis
    let serviceRedis;
    let serviceRedisStatus = 'not_configured';
    try {
      serviceRedis = getServiceRedisClient(serviceConfig);
      serviceRedisStatus = 'connected';
    } catch (e) {
      serviceRedisStatus = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    // Check for long-term memories if user_id provided
    let longTermMemories: Record<string, any[]> = {};
    if (user_id && typeof user_id === 'string' && serviceRedis) {
      const memoryTypes = ['user_preferences', 'semantic', 'summary', 'episodic'];
      for (const memType of memoryTypes) {
        const key = RedisKeys.longTermMemory(user_id, memType as any);
        const memories = await serviceRedis.lrange(key, 0, -1);
        longTermMemories[memType] = memories || [];
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        service: {
          id: serviceConfig.id,
          name: serviceConfig.name,
          serviceType: serviceConfig.serviceType,
          memoryTypes: serviceConfig.memoryTypes,
          hasRedisUrl: !!serviceConfig.redisUrl,
        },
        environment: {
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
          openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'not_set',
        },
        serviceRedisStatus,
        longTermMemories,
      },
    });
  } catch (error) {
    console.error('Debug check error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

