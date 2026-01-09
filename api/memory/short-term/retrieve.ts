import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, getServiceRedisClient, RedisKeys } from '../../../lib/redis.js';
import type { ShortTermMemory, ServiceConfig, ApiResponse } from '../../../lib/types.js';

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
    const { session_id, limit } = req.query;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: session_id',
      });
    }

    const configRedis = getRedisClient();

    // First, we need to check all possible service Redis instances
    // Since we don't know which service this session belongs to yet,
    // we'll try to get metadata from the session_id
    // The metadata should tell us which service_id to use

    // For now, we'll need to pass service_id as a query parameter
    // or store session metadata in the global Redis
    const { service_id } = req.query;

    if (!service_id || typeof service_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: service_id (needed to locate session data)',
      });
    }

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

    // Get service-specific Redis client
    let serviceRedis;
    try {
      serviceRedis = getServiceRedisClient(serviceConfig);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to service Redis',
      });
    }

    // Get session metadata from service-specific Redis
    const metadata = await serviceRedis.hgetall(RedisKeys.sessionMetadata(session_id));

    if (!metadata || Object.keys(metadata).length === 0) {
      return res.status(404).json({
        success: false,
        error: `Session not found: ${session_id}`,
      });
    }

    // Get messages from service-specific Redis
    const messageKey = RedisKeys.sessionMessages(session_id);
    const maxMessages = limit ? parseInt(limit as string, 10) : -1;

    const messages = await serviceRedis.lrange<ShortTermMemory>(
      messageKey,
      0,
      maxMessages === -1 ? -1 : maxMessages - 1
    );

    return res.status(200).json({
      success: true,
      data: {
        session_id,
        user_id: metadata.user_id,
        service_id: metadata.service_id,
        last_activity: metadata.last_activity,
        messages: messages || [],
        message_count: messages?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error retrieving short-term memory:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

