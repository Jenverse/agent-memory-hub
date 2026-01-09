import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, getServiceRedisClient, RedisKeys } from '../../../lib/redis.js';
import { validateAgainstSchema, createValidationErrorResponse } from '../../../lib/validation.js';
import type { StoreShortTermRequest, ServiceConfig, ApiResponse } from '../../../lib/types.js';

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

