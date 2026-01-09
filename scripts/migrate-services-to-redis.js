// Script to migrate services from localStorage format to Redis
// This helps you move your existing services to the backend

import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('❌ REDIS_URL not found in .env.local');
  process.exit(1);
}

console.log('🔄 Connecting to Redis...');
const redis = new Redis(REDIS_URL);

// Sample services - replace these with your actual service data from localStorage
const services = [
  {
    id: "travel-agent-example",
    name: "Travel Agent",
    redisUrl: "", // Add your service-specific Redis URL here
    agentPurpose: "Help users plan trips and remember their travel preferences",
    memoryGoals: ["Remember user preferences", "Track past trips"],
    schemas: {
      shortTermFields: [
        { id: "1", name: "user_id", type: "string", required: true },
        { id: "2", name: "session_id", type: "string", required: true },
        { id: "3", name: "role", type: "string", required: true },
        { id: "4", name: "text", type: "string", required: true },
        { id: "5", name: "timestamp", type: "string", required: false }
      ],
      longTermBuckets: [
        {
          id: "preferences",
          name: "preferences",
          description: "User travel preferences",
          schema: [
            { id: "1", name: "budget", type: "string", required: false },
            { id: "2", name: "destinations", type: "array", required: false }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function migrateServices() {
  try {
    console.log(`\n📦 Migrating ${services.length} service(s) to Redis...\n`);

    for (const service of services) {
      // Store service config
      const configKey = `service_config:${service.id}`;
      await redis.set(configKey, JSON.stringify(service));
      
      // Add to services set
      await redis.sadd('services:all', service.id);
      
      console.log(`✅ Migrated: ${service.name} (${service.id})`);
    }

    console.log('\n🎉 Migration complete!');
    console.log('\nNext steps:');
    console.log('  1. Run: vercel dev');
    console.log('  2. Open: http://localhost:3000');
    console.log('  3. Your services should now appear in the dropdown!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await redis.quit();
  }
}

migrateServices();

