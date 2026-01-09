// Quick test to verify Upstash Redis connection
import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testConnection() {
  console.log('🧪 Testing Upstash Redis connection...\n');
  
  try {
    // Test 1: Set a value
    console.log('1️⃣  Setting test value...');
    await redis.set('test:connection', 'Hello from Agent Memory Hub!');
    console.log('   ✅ Value set successfully\n');
    
    // Test 2: Get the value
    console.log('2️⃣  Retrieving test value...');
    const value = await redis.get('test:connection');
    console.log(`   ✅ Retrieved: "${value}"\n`);
    
    // Test 3: Delete the value
    console.log('3️⃣  Cleaning up...');
    await redis.del('test:connection');
    console.log('   ✅ Test value deleted\n');
    
    console.log('🎉 SUCCESS! Your Upstash Redis is working perfectly!\n');
    console.log('Next steps:');
    console.log('  1. Add your OpenAI API key to .env.local');
    console.log('  2. Run: vercel dev');
    console.log('  3. Open: http://localhost:3000\n');
    
  } catch (error) {
    console.error('❌ ERROR: Failed to connect to Redis\n');
    console.error('Details:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  - Check your UPSTASH_REDIS_REST_URL in .env.local');
    console.error('  - Check your UPSTASH_REDIS_REST_TOKEN in .env.local');
    console.error('  - Make sure you copied the REST API credentials (not Redis CLI)\n');
    process.exit(1);
  }
}

testConnection();

