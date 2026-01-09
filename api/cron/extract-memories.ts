import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, RedisKeys } from '../../lib/redis.js';
import { extractMemoriesFromConversation } from '../../lib/memory-extraction.js';
import { validateAgainstSchema } from '../../lib/validation.js';
import type { ServiceConfig, ShortTermMemory, ApiResponse } from '../../lib/types.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ApiResponse>
) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    const redis = getRedisClient();
    let processedSessions = 0;
    let extractedMemories = 0;
    const errors: string[] = [];

    // Get all service IDs
    const serviceIds = await redis.smembers(RedisKeys.allServices());

    if (!serviceIds || serviceIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No services configured',
          processed_sessions: 0,
          extracted_memories: 0,
        },
      });
    }

    // For each service, find active sessions
    // Note: In production, you'd want to track active sessions more efficiently
    // For now, we'll use a simple approach with a processing flag

    // Get all keys matching session pattern
    const sessionKeys = await redis.keys('session:*:messages');

    for (const messageKey of sessionKeys) {
      try {
        // Extract session_id from key
        const sessionId = messageKey.split(':')[1];
        
        // Get session metadata
        const metadata = await redis.hgetall(RedisKeys.sessionMetadata(sessionId));
        
        if (!metadata || !metadata.service_id || !metadata.user_id) {
          continue;
        }

        // Check if already processed
        const processedKey = `session:${sessionId}:processed`;
        const alreadyProcessed = await redis.get(processedKey);
        
        if (alreadyProcessed) {
          continue;
        }

        // Get service config
        const serviceConfig = await redis.get<ServiceConfig>(
          RedisKeys.serviceConfig(metadata.service_id as string)
        );

        if (!serviceConfig) {
          continue;
        }

        // Get messages
        const messages = await redis.lrange<ShortTermMemory>(messageKey, 0, -1);

        if (!messages || messages.length === 0) {
          continue;
        }

        // Extract memories using AI
        const extractedData = await extractMemoriesFromConversation(
          messages,
          serviceConfig
        );

        // Store extracted memories in long-term buckets
        for (const [bucketName, entries] of Object.entries(extractedData)) {
          if (!Array.isArray(entries) || entries.length === 0) {
            continue;
          }

          // Find bucket schema
          const bucket = serviceConfig.schemas.longTermBuckets.find(
            (b) => b.name === bucketName
          );

          if (!bucket) {
            errors.push(`Bucket not found: ${bucketName}`);
            continue;
          }

          // Validate and store each entry
          for (const entry of entries) {
            const validation = validateAgainstSchema(entry, bucket.schema);

            if (!validation.valid) {
              errors.push(
                `Validation failed for ${bucketName}: ${validation.errors
                  .map((e) => e.message)
                  .join(', ')}`
              );
              continue;
            }

            // Store in long-term memory
            const bucketKey = RedisKeys.userBucket(
              metadata.user_id as string,
              metadata.service_id as string,
              bucketName
            );

            const timestamp = new Date().toISOString();
            const memoryEntry = {
              id: `${bucketName}_${Date.now()}`,
              bucket: bucketName,
              data: entry,
              created_at: timestamp,
              updated_at: timestamp,
            };

            await redis.rpush(bucketKey, memoryEntry);
            extractedMemories++;
          }
        }

        // Mark session as processed
        await redis.set(processedKey, '1', { ex: 86400 }); // Expire after 24 hours
        processedSessions++;
      } catch (error) {
        console.error(`Error processing session:`, error);
        errors.push(`Session processing error: ${error}`);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        processed_sessions: processedSessions,
        extracted_memories: extractedMemories,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Error in memory extraction cron:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

