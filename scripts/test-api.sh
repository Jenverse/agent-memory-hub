#!/bin/bash

# Test script for Agent Memory Hub API
# Make sure the server is running (vercel dev) before running this script

API_URL="http://localhost:3000/api"

echo "🧪 Testing Agent Memory Hub API"
echo "================================"
echo ""

# Test 1: Create a service
echo "1️⃣  Creating test service..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/services/create" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-service-001",
    "name": "Test Service",
    "agentPurpose": "Testing the memory system",
    "memoryGoals": ["Test memory storage"],
    "schemas": {
      "shortTermFields": [
        {"id": "1", "name": "user_id", "type": "string", "required": true},
        {"id": "2", "name": "session_id", "type": "string", "required": true},
        {"id": "3", "name": "role", "type": "string", "required": true},
        {"id": "4", "name": "text", "type": "string", "required": true},
        {"id": "5", "name": "timestamp", "type": "string", "required": false},
        {"id": "6", "name": "metadata", "type": "object", "required": false}
      ],
      "longTermBuckets": [
        {
          "id": "test-bucket",
          "name": "test_memories",
          "description": "Test memory bucket",
          "schema": [
            {"id": "1", "name": "test_field", "type": "string", "required": true}
          ]
        }
      ]
    }
  }')

echo "$CREATE_RESPONSE" | jq '.'
echo ""

# Test 2: Store short-term memory (user message)
echo "2️⃣  Storing user message..."
STORE_RESPONSE=$(curl -s -X POST "$API_URL/memory/short-term/store" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "test-service-001",
    "data": {
      "user_id": "test_user_123",
      "session_id": "test_session_456",
      "role": "user",
      "text": "Hello, this is a test!",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }')

echo "$STORE_RESPONSE" | jq '.'
echo ""

# Test 2b: Store agent response
echo "2b️⃣  Storing agent response..."
STORE_RESPONSE_2=$(curl -s -X POST "$API_URL/memory/short-term/store" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "test-service-001",
    "data": {
      "user_id": "test_user_123",
      "session_id": "test_session_456",
      "role": "agent",
      "text": "Hi! I received your test message.",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }')

echo "$STORE_RESPONSE_2" | jq '.'
echo ""

# Test 3: Retrieve short-term memory
echo "3️⃣  Retrieving conversation..."
RETRIEVE_RESPONSE=$(curl -s "$API_URL/memory/short-term/retrieve?session_id=test_session_456")

echo "$RETRIEVE_RESPONSE" | jq '.'
echo ""

# Test 4: Store long-term memory
echo "4️⃣  Storing long-term memory..."
LONG_TERM_RESPONSE=$(curl -s -X POST "$API_URL/memory/long-term/store" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "test-service-001",
    "user_id": "test_user_123",
    "bucket_name": "test_memories",
    "data": {
      "test_field": "This is a test memory!"
    }
  }')

echo "$LONG_TERM_RESPONSE" | jq '.'
echo ""

# Test 5: Retrieve long-term memory
echo "5️⃣  Retrieving long-term memory..."
LONG_RETRIEVE_RESPONSE=$(curl -s "$API_URL/memory/long-term/retrieve?user_id=test_user_123&service_id=test-service-001")

echo "$LONG_RETRIEVE_RESPONSE" | jq '.'
echo ""

echo "✅ All tests complete!"
echo ""
echo "💡 Next steps:"
echo "   - Check Upstash dashboard to see the data"
echo "   - Test the cron job: curl -X POST $API_URL/cron/extract-memories -H 'Authorization: Bearer YOUR_CRON_SECRET'"
echo "   - Try the Travel Agent demo in the UI!"

