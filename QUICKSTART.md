# 🚀 Quick Start Guide

Get your Agent Memory Hub up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Upstash Redis (Free)

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up (it's free!)
3. Click **"Create Database"**
4. Name it `agent-memory-hub`
5. Select a region close to you
6. Click **"Create"**
7. Copy the **REST URL** and **REST Token**

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Backend (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-key-here

# Cron Job Security (generate a random string)
CRON_SECRET=my-super-secret-key-12345
```

## Step 4: Run Locally

Install Vercel CLI (if not already installed):

```bash
npm install -g vercel
```

Start the development server:

```bash
vercel dev
```

This will start:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3000/api/*`

## Step 5: Configure OpenAI API Key in UI

1. Open `http://localhost:3000`
2. Click the **Settings** icon (top right)
3. Enter your OpenAI API key
4. Click **Save**

## Step 6: Test the Travel Agent!

1. Go to the **"Demo"** tab
2. Enter a User ID (e.g., `user123`)
3. Start chatting: "I want to plan a trip to Paris"
4. The agent will respond with travel recommendations
5. Your conversation is automatically saved to Redis!

## 🎉 What Just Happened?

1. **Frontend** → Sent your message to OpenAI
2. **Backend** → Stored conversation in Redis (short-term memory)
3. **Cron Job** → Will extract structured data every 5 minutes (long-term memory)
4. **Next Chat** → Agent will remember your preferences!

## Testing Memory Extraction

The cron job runs every 5 minutes in production. To test it manually:

```bash
curl -X POST http://localhost:3000/api/cron/extract-memories \
  -H "Authorization: Bearer my-super-secret-key-12345"
```

## Viewing Your Data in Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Click on your database
3. Go to **"Data Browser"**
4. You'll see keys like:
   - `session:session_123:messages` (conversations)
   - `user:user123:service:travel-agent-example:bucket:travel_preferences` (memories)

## Deploy to Production

```bash
vercel --prod
```

Set environment variables in Vercel:

```bash
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add OPENAI_API_KEY
vercel env add CRON_SECRET
```

## Troubleshooting

### "Failed to connect to Redis"
- Check your Upstash credentials in `.env.local`
- Make sure you copied the **REST URL** and **REST Token** (not the regular URL)

### "OpenAI API error"
- Verify your API key is correct
- Check you have credits in your OpenAI account

### "Cron job not running"
- Cron jobs only work in production on Vercel
- Test manually using the curl command above

### "No memories loaded"
- Wait 5 minutes after chatting for the cron job to run
- Or trigger it manually with the curl command
- Check Vercel logs for any errors

## Next Steps

1. **Explore Service Config**: Go to "Travel Planning Agent" → Configure schemas
2. **View API Docs**: Check the "API Integration" tab
3. **Create Your Own Agent**: Click "New Service" and build a custom agent!
4. **Monitor Usage**: Check Upstash dashboard for Redis usage

## Need Help?

- Check `BACKEND_SETUP.md` for detailed backend documentation
- View API endpoints in the UI under "API Integration" tab
- Check browser console for errors
- Check Vercel logs: `vercel logs`

Happy building! 🎉

