#!/bin/bash

# Test script for new memory structure
# Run this after having a conversation in the Travel Agent Demo

set -e

API_URL="http://localhost:3001/api"
USER_ID="test_user_new_structure"
SERVICE_ID="travel-agent-example"

echo "🧪 Testing New Memory Structure"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "  User ID: $USER_ID"
echo "  Service ID: $SERVICE_ID"
echo "  API URL: $API_URL"
echo ""

# Step 1: Trigger memory extraction
echo -e "${YELLOW}Step 1: Triggering memory extraction...${NC}"
EXTRACT_RESPONSE=$(curl -s -X POST "$API_URL/cron/extract-memories" \
  -H "Authorization: Bearer agent-memory-hub-secret-2024")

echo "$EXTRACT_RESPONSE" | jq '.'
echo ""

# Check if extraction was successful
SUCCESS=$(echo "$EXTRACT_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Memory extraction failed!"
  exit 1
fi

echo -e "${GREEN}✅ Memory extraction successful!${NC}"
echo ""

# Step 2: Retrieve long-term memories
echo -e "${YELLOW}Step 2: Retrieving long-term memories...${NC}"
MEMORIES_RESPONSE=$(curl -s "$API_URL/memory/long-term/retrieve?user_id=$USER_ID&service_id=$SERVICE_ID")

echo "$MEMORIES_RESPONSE" | jq '.'
echo ""

# Check if retrieval was successful
SUCCESS=$(echo "$MEMORIES_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Memory retrieval failed!"
  exit 1
fi

echo -e "${GREEN}✅ Memory retrieval successful!${NC}"
echo ""

# Step 3: Analyze extracted memories
echo -e "${YELLOW}Step 3: Analyzing extracted memories...${NC}"
echo ""

# Check for generic_memory (unstructured)
GENERIC_COUNT=$(echo "$MEMORIES_RESPONSE" | jq -r '.data.memories.generic_memory | length // 0')
echo -e "${BLUE}📝 Unstructured Memories (generic_memory):${NC} $GENERIC_COUNT entries"
if [ "$GENERIC_COUNT" -gt 0 ]; then
  echo "$MEMORIES_RESPONSE" | jq -r '.data.memories.generic_memory[] | "  - \(.data.text)"'
fi
echo ""

# Check for preferences (structured)
PREFS_COUNT=$(echo "$MEMORIES_RESPONSE" | jq -r '.data.memories.preferences | length // 0')
echo -e "${BLUE}⚙️  Structured Memories (preferences):${NC} $PREFS_COUNT entries"
if [ "$PREFS_COUNT" -gt 0 ]; then
  echo "$MEMORIES_RESPONSE" | jq -r '.data.memories.preferences[0].data | to_entries[] | "  - \(.key): \(.value)"'
fi
echo ""

# Check for facts (structured)
FACTS_COUNT=$(echo "$MEMORIES_RESPONSE" | jq -r '.data.memories.facts | length // 0')
echo -e "${BLUE}📊 Structured Memories (facts):${NC} $FACTS_COUNT entries"
if [ "$FACTS_COUNT" -gt 0 ]; then
  echo "$MEMORIES_RESPONSE" | jq -r '.data.memories.facts[] | "  - \(.data.fact_type): \(.data.fact_value)"'
fi
echo ""

# Check for past_trips (structured)
TRIPS_COUNT=$(echo "$MEMORIES_RESPONSE" | jq -r '.data.memories.past_trips | length // 0')
echo -e "${BLUE}✈️  Structured Memories (past_trips):${NC} $TRIPS_COUNT entries"
if [ "$TRIPS_COUNT" -gt 0 ]; then
  echo "$MEMORIES_RESPONSE" | jq -r '.data.memories.past_trips[] | "  - \(.data.destination) (\(.data.trip_dates // "no date")) - Rating: \(.data.rating // "N/A")"'
fi
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Summary:"
echo "  - Unstructured memories: $GENERIC_COUNT"
echo "  - Preferences: $PREFS_COUNT"
echo "  - Facts: $FACTS_COUNT"
echo "  - Past trips: $TRIPS_COUNT"
echo ""
echo "Total memories extracted: $((GENERIC_COUNT + PREFS_COUNT + FACTS_COUNT + TRIPS_COUNT))"
echo ""

