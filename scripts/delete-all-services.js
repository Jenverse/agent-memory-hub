// Script to delete ALL services from Redis
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('❌ REDIS_URL not found in .env');
  process.exit(1);
}

const redis = new Redis(REDIS_URL);

async function deleteAllServices() {
  try {
    console.log('🗑️  Fetching all services...\n');

    // Get all service IDs
    const serviceIds = await redis.smembers('services:all');
    
    if (serviceIds.length === 0) {
      console.log('No services found.');
      await redis.quit();
      return;
    }

    console.log(`Found ${serviceIds.length} service(s) to delete:\n`);

    for (const serviceId of serviceIds) {
      // Get service name for display
      const configKey = `service_config:${serviceId}`;
      const config = await redis.get(configKey);
      let serviceName = serviceId;
      if (config) {
        try {
          const parsed = JSON.parse(config);
          serviceName = parsed.name || serviceId;
        } catch {}
      }
      
      // Delete service config
      await redis.del(configKey);
      
      // Remove from services set
      await redis.srem('services:all', serviceId);
      
      console.log(`✅ Deleted: ${serviceName} (${serviceId})`);
    }

    console.log('\n🎉 All services deleted!');
    
    // Verify
    const remaining = await redis.smembers('services:all');
    console.log(`\nRemaining services: ${remaining.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redis.quit();
  }
}

deleteAllServices();

