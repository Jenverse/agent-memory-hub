# Backend Setup Guide

This guide will help you set up the backend API for the Agent Memory Hub.

## Prerequisites

- Node.js 18+ installed
- Vercel account (free tier is fine)
- Upstash account (free tier is fine)
- OpenAI API key

## Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `@upstash/redis` - Serverless Redis client
- `@vercel/node` - Vercel serverless function types

## Step 2: Set Up Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up or log in
3. Click "Create Database"
4. Choose a name (e.g., "agent-memory-hub")
5. Select a region close to you
6. Click "Create"
7. Copy the **REST URL** and **REST Token** from the database details

## Step 3: Configure Environment Variables

### For Local Development:

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
OPENAI_API_KEY=sk-your-openai-key-here
CRON_SECRET=your-random-secret-here
```

### For Vercel Deployment:

Set environment variables in Vercel:

```bash
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add OPENAI_API_KEY
vercel env add CRON_SECRET
```

Or use the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable for Production, Preview, and Development

## Step 4: Test Locally

Install Vercel CLI:

```bash
npm install -g vercel
```

Run the development server:

```bash
vercel dev
```

This will start:
- Frontend on `http://localhost:3000`
- API routes on `http://localhost:3000/api/*`

## Step 5: Deploy to Vercel

```bash
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

## API Endpoints

### Memory Endpoints

- `POST /api/memory/short-term/store` - Store conversation
- `GET /api/memory/short-term/retrieve?session_id=X` - Get session history
- `POST /api/memory/long-term/store` - Store extracted memory
- `GET /api/memory/long-term/retrieve?user_id=X&service_id=Y` - Get user memories

### Service Configuration Endpoints

- `POST /api/services/create` - Create new service
- `GET /api/services/[id]` - Get service config
- `PUT /api/services/[id]` - Update service config
- `GET /api/services/list` - List all services

### Cron Jobs

- `/api/cron/extract-memories` - Runs every 5 minutes (automatic)

## Testing the API

Use curl or Postman to test endpoints:

```bash
# Create a service
curl -X POST http://localhost:3000/api/services/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-service",
    "name": "Test Service",
    "agentPurpose": "Testing",
    "memoryGoals": ["Test goal"],
    "schemas": {
      "shortTermFields": [
        {"id": "1", "name": "user_id", "type": "string", "required": true},
        {"id": "2", "name": "session_id", "type": "string", "required": true},
        {"id": "3", "name": "role", "type": "string", "required": true},
        {"id": "4", "name": "text", "type": "string", "required": true},
        {"id": "5", "name": "timestamp", "type": "string", "required": false},
        {"id": "6", "name": "metadata", "type": "object", "required": false}
      ],
      "longTermBuckets": []
    }
  }'

# Store a user message
curl -X POST http://localhost:3000/api/memory/short-term/store \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "test-service",
    "data": {
      "user_id": "user_123",
      "session_id": "session_abc",
      "role": "user",
      "text": "Hello!",
      "timestamp": "2024-01-07T12:00:00Z"
    }
  }'

# Store an agent response
curl -X POST http://localhost:3000/api/memory/short-term/store \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "test-service",
    "data": {
      "user_id": "user_123",
      "session_id": "session_abc",
      "role": "agent",
      "text": "Hi there!",
      "timestamp": "2024-01-07T12:00:05Z"
    }
  }'

# Retrieve conversation
curl "http://localhost:3000/api/memory/short-term/retrieve?session_id=session_abc"
```

## Troubleshooting

### Redis Connection Error

Make sure your Upstash credentials are correct in `.env.local` or Vercel environment variables.

### OpenAI API Error

Verify your OpenAI API key is valid and has credits available.

### Cron Job Not Running

Cron jobs only work in production on Vercel. Test the endpoint manually:

```bash
curl -X POST http://localhost:3000/api/cron/extract-memories \
  -H "Authorization: Bearer your-cron-secret"
```

## Next Steps

1. Update the frontend to use the backend API
2. Test the complete flow from UI to backend
3. Monitor Upstash usage in the dashboard
4. Check Vercel logs for any errors

