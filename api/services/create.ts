import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, RedisKeys } from '../../lib/redis.js';
import type { ServiceConfig, ApiResponse } from '../../lib/types.js';

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
    const serviceConfig = req.body as ServiceConfig;

    // Validate required fields
    if (!serviceConfig.id || !serviceConfig.name || !serviceConfig.schemas) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, and schemas',
      });
    }

    const redis = getRedisClient();

    // Check if service already exists
    const existing = await redis.get(RedisKeys.serviceConfig(serviceConfig.id));
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Service already exists: ${serviceConfig.id}`,
      });
    }

    // Add timestamps
    const timestamp = new Date().toISOString();
    const configWithTimestamps = {
      ...serviceConfig,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Store service config
    await redis.set(
      RedisKeys.serviceConfig(serviceConfig.id),
      configWithTimestamps
    );

    // Add to services list
    await redis.sadd(RedisKeys.allServices(), serviceConfig.id);

    return res.status(201).json({
      success: true,
      data: configWithTimestamps,
    });
  } catch (error) {
    console.error('Error creating service:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

