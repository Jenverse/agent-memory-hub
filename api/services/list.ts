import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, RedisKeys } from '../../lib/redis.js';
import type { ServiceConfig, ApiResponse } from '../../lib/types.js';

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
    const redis = getRedisClient();

    // Get all service IDs
    const serviceIds = await redis.smembers(RedisKeys.allServices());

    if (!serviceIds || serviceIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Get all service configs
    const services: ServiceConfig[] = [];
    for (const id of serviceIds) {
      const config = await redis.get<ServiceConfig>(RedisKeys.serviceConfig(id));
      if (config) {
        services.push(config);
      }
    }

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Error listing services:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

