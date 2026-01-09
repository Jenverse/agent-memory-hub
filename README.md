# Agent Memory Hub

A complete memory management system for AI agents with Redis-backed storage and automatic memory extraction.

## 🚀 Quick Start

**New to this project?** Check out [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide!

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

### Frontend
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

### Backend
- Vercel Serverless Functions
- Upstash Redis (serverless)
- OpenAI API (for memory extraction)

## Features

✅ **Memory Service Configuration** - Define custom schemas for short-term and long-term memory
✅ **Travel Agent Demo** - Interactive chat with memory-aware AI
✅ **Automatic Memory Extraction** - AI-powered extraction from conversations
✅ **Redis Storage** - Fast, serverless Redis backend via Upstash
✅ **API Integration** - RESTful API for memory operations
✅ **Background Processing** - Cron jobs for automatic memory extraction

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Detailed backend setup guide
- **[MEMORY_STRUCTURE.md](./MEMORY_STRUCTURE.md)** - Understanding memory architecture
- **API Documentation** - Available in the UI under "API Integration" tab

## 🧪 Testing

Run the API test script:

```bash
# Make sure vercel dev is running first
./scripts/test-api.sh
```

## Project Structure

```
agent-memory-hub/
├── src/                    # Frontend (React + TypeScript)
│   ├── components/         # UI components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities and API client
│   └── hooks/             # React hooks
├── api/                   # Backend (Vercel Serverless Functions)
│   ├── memory/            # Memory storage/retrieval endpoints
│   ├── services/          # Service configuration endpoints
│   └── cron/              # Background jobs
├── lib/                   # Shared utilities (frontend + backend)
│   ├── types.ts           # TypeScript types
│   ├── redis.ts           # Redis client
│   ├── validation.ts      # Schema validation
│   └── memory-extraction.ts  # AI extraction logic
└── scripts/               # Utility scripts
```
