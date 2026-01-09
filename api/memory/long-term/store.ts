import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, getServiceRedisClient, RedisKeys } from '../../../lib/redis.js';
import { validateAgainstSchema, createValidationErrorResponse } from '../../../lib/validation.js';
import type { StoreLongTermRequest, ServiceConfig, ApiResponse } from '../../../lib/types.js';

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
    const { service_id, user_id, bucket_name, data } = req.body as StoreLongTermRequest;

    // Validate request
    if (!service_id || !user_id || !bucket_name || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: service_id, user_id, bucket_name, and data',
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

    // Find bucket schema
    const bucket = serviceConfig.schemas.longTermBuckets.find(
      (b) => b.name === bucket_name
    );

    if (!bucket) {
      return res.status(404).json({
        success: false,
        error: `Bucket not found: ${bucket_name}`,
      });
    }

    // Validate data against bucket schema
    const validation = validateAgainstSchema(data, bucket.schema);

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
    const bucketKey = RedisKeys.userBucket(user_id, service_id, bucket_name);
    const timestamp = new Date().toISOString();

    const memoryEntry = {
      id: `${bucket_name}_${Date.now()}`,
      bucket: bucket_name,
      data,
      created_at: timestamp,
      updated_at: timestamp,
    };

    // Store as list (for buckets that can have multiple entries like past_trips)
    await serviceRedis.rpush(bucketKey, memoryEntry);

    return res.status(200).json({
      success: true,
      data: {
        id: memoryEntry.id,
        bucket: bucket_name,
        stored_at: timestamp,
      },
    });
  } catch (error) {
    console.error('Error storing long-term memory:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

