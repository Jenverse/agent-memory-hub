import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, RedisKeys } from '../../lib/redis.js';
import type { ServiceConfig, ApiResponse } from '../../lib/types.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ApiResponse>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing service id',
    });
  }

  const redis = getRedisClient();

  // GET - Retrieve service config
  if (req.method === 'GET') {
    try {
      const serviceConfig = await redis.get<ServiceConfig>(
        RedisKeys.serviceConfig(id)
      );

      if (!serviceConfig) {
        return res.status(404).json({
          success: false,
          error: `Service not found: ${id}`,
        });
      }

      return res.status(200).json({
        success: true,
        data: serviceConfig,
      });
    } catch (error) {
      console.error('Error retrieving service:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // PUT - Update service config
  if (req.method === 'PUT') {
    try {
      const updates = req.body as Partial<ServiceConfig>;

      const existing = await redis.get<ServiceConfig>(RedisKeys.serviceConfig(id));

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: `Service not found: ${id}`,
        });
      }

      const updated = {
        ...existing,
        ...updates,
        id, // Ensure ID doesn't change
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await redis.set(RedisKeys.serviceConfig(id), updated);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      console.error('Error updating service:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
}

