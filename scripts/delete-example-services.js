// Script to delete example services that were pre-populated
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('❌ REDIS_URL not found in .env');
  process.exit(1);
}

const redis = new Redis(REDIS_URL);

// Example service IDs to delete
const exampleServiceIds = [
  'travel-agent-example',
  'shopping-assistant-example',
  'productivity-assistant-example',
  'test-service-001'
];

async function deleteExampleServices() {
  try {
    console.log('🗑️  Deleting example services...\n');

    for (const serviceId of exampleServiceIds) {
      // Delete service config
      const configKey = `service_config:${serviceId}`;
      await redis.del(configKey);
      
      // Remove from services set
      await redis.srem('services:all', serviceId);
      
      console.log(`✅ Deleted: ${serviceId}`);
    }

    console.log('\n🎉 All example services deleted!');
    console.log('\nRemaining services:');
    
    // List remaining services
    const remainingIds = await redis.smembers('services:all');
    for (const id of remainingIds) {
      const config = await redis.get(`service_config:${id}`);
      if (config) {
        const service = JSON.parse(config);
        console.log(`  - ${service.name} (${id})`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redis.quit();
  }
}

deleteExampleServices();

