# Agent Memory Hub - Product Requirements Document

## Overview

**Agent Memory Hub** is a universal memory management platform that enables AI agents to store, retrieve, and utilize contextual memory across conversations. It provides a schema-driven approach where each AI service can define its own memory structure, making agents more personalized and context-aware.

## Problem Statement

AI agents today suffer from "amnesia" - they cannot remember user preferences, past interactions, or learned information across sessions. This leads to:
- Repetitive conversations where users must re-explain their preferences
- Generic responses that don't account for user history
- Lost opportunities for personalization and relationship building

## Solution

Agent Memory Hub provides:
1. **Short-term Memory**: Conversation logs within a session
2. **Long-term Memory**: Persistent, structured information about users (preferences, facts, past experiences)
3. **Schema-driven Architecture**: Each AI service defines what memories to capture and how to structure them
4. **Real-time Extraction**: Memories are extracted inline during conversations, not via batch jobs

---

## Core Concepts

### Services
A **Service** represents an AI agent configuration. Each service defines:
- **Agent Purpose**: What the agent does (e.g., "Travel planning assistant")
- **Memory Goals**: What information to remember (e.g., "User travel preferences", "Past trip history")
- **Short-term Schema**: Structure for conversation logs
- **Long-term Buckets**: Categories for persistent memories with their own schemas

### Memory Types

| Type | Purpose | Storage | Lifespan |
|------|---------|---------|----------|
| Short-term | Conversation history | Redis List | Session-based |
| Long-term | User facts, preferences | Redis List per bucket | Persistent |

### Schema-driven Design
Services define schemas that specify:
- Field names and types (string, number, boolean, array, object)
- Required vs optional fields
- Bucket categories for long-term memory

---

## Features

### 1. Service Management
- Create, read, update, delete AI services
- Define custom schemas for each service
- Configure per-service Redis connections (or use shared)
- Visual schema builder UI

### 2. Short-term Memory
- Store conversation messages (user + agent)
- Retrieve session history
- Adapt to service-defined schema dynamically

### 3. Long-term Memory
- Store structured user information in buckets
- Retrieve memories by user, service, and bucket
- **Inline Extraction**: Memories extracted during chat response (Option A)

### 4. Inline Memory Extraction (Option A)
The system extracts long-term memories in the same API call as the chat response:

```
User: "I'm vegetarian and have a budget of $3000"

Agent Response: "Great! I'll keep that in mind for your trip planning...

---MEMORY_EXTRACT---
{"memories": [
  {"bucket_name": "preferences", "data": {"dietary_restrictions": ["vegetarian"], "budget_range": "$3000"}}
]}"
```

The frontend:
1. Appends extraction instructions to the system prompt
2. Parses the response to separate chat from memories
3. Stores extracted memories via long-term API
4. Shows user only the clean chat response

### 5. Demo Application
- Interactive chat interface
- Service selector dropdown
- Memory viewer dialog
- Real-time memory extraction demonstration

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Service    │  │   Demo      │  │   Memory Viewer         │  │
│  │  Manager    │  │   Chat UI   │  │   (Short + Long term)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Serverless API                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ /api/services│  │ /api/memory  │  │ /api/chat/completions│   │
│  │   CRUD ops   │  │  store/get   │  │   OpenAI proxy       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Redis Storage                           │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │ Config Redis    │  │ Service Redis (per-service or shared)│  │
│  │ (service configs)│  │ (short-term + long-term memories)   │  │
│  └─────────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

---

## API Reference

### Services API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/services` | GET | List all services |
| `/api/services` | POST | Create a new service |
| `/api/services/[id]` | GET | Get service by ID |
| `/api/services/[id]` | PUT | Update service |
| `/api/services/[id]` | DELETE | Delete service |

### Memory API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/memory/short-term/store` | POST | Store short-term memory |
| `/api/memory/short-term/retrieve` | GET | Retrieve session messages |
| `/api/memory/long-term/store` | POST | Store long-term memory |
| `/api/memory/long-term/retrieve` | GET | Retrieve user memories |

### Chat API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/completions` | POST | Proxy to OpenAI with memory context |

---

## Data Models

### Service Configuration
```typescript
interface ServiceConfig {
  id: string;
  name: string;
  redisUrl?: string;  // Optional per-service Redis
  agentPurpose: string;
  memoryGoals: string[];
  schemas: {
    shortTermFields: SchemaField[];
    longTermBuckets: LongTermBucket[];
  };
}
```

### Long-term Bucket
```typescript
interface LongTermBucket {
  id: string;
  name: string;
  description: string;
  isUnstructured?: boolean;
  schema: SchemaField[];
}
```

### Schema Field
```typescript
interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
}
```

---

## Memory Extraction Flow

```
1. User sends message
         │
         ▼
2. Frontend builds system prompt with:
   - Agent purpose & personality
   - Existing user memories (if any)
   - Memory extraction instructions + schema
         │
         ▼
3. Call OpenAI API
         │
         ▼
4. Agent responds with:
   "Natural response to user...

   ---MEMORY_EXTRACT---
   {"memories": [...]}"
         │
         ▼
5. Frontend parses response:
   - Split by delimiter
   - Extract chat response
   - Parse memory JSON
         │
         ▼
6. Store memories via /api/memory/long-term/store
         │
         ▼
7. Display chat response to user
```

---

## Example: Travel Agent Service

### Service Configuration
```json
{
  "id": "travel-agent-example",
  "name": "Travel Agent",
  "agentPurpose": "Help users plan personalized trips",
  "memoryGoals": [
    "Remember user travel preferences",
    "Track dietary restrictions",
    "Record past trips"
  ],
  "schemas": {
    "shortTermFields": [
      {"name": "user_id", "type": "string", "required": true},
      {"name": "session_id", "type": "string", "required": true},
      {"name": "user_message", "type": "string", "required": true},
      {"name": "agent_response", "type": "string", "required": true}
    ],
    "longTermBuckets": [
      {
        "name": "preferences",
        "description": "User travel preferences",
        "schema": [
          {"name": "budget_range", "type": "string"},
          {"name": "dietary_restrictions", "type": "array"},
          {"name": "travel_style", "type": "string"}
        ]
      },
      {
        "name": "facts",
        "description": "Facts about the user",
        "schema": [
          {"name": "occupation", "type": "string"},
          {"name": "home_city", "type": "string"}
        ]
      },
      {
        "name": "past_trips",
        "description": "Previous travel history",
        "schema": [
          {"name": "destination", "type": "string"},
          {"name": "trip_dates", "type": "string"},
          {"name": "highlights", "type": "array"}
        ]
      }
    ]
  }
}
```

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite + TypeScript |
| UI Components | shadcn/ui + Tailwind CSS |
| Backend | Vercel Serverless Functions |
| Database | Redis (Upstash) |
| LLM | OpenAI GPT-4o-mini |
| Hosting | Vercel |

---

## Future Enhancements

1. **Memory Deduplication**: Detect and merge duplicate memories
2. **Memory Importance Scoring**: Prioritize memories by relevance
3. **Memory Decay**: Automatically reduce weight of old memories
4. **Vector Embeddings**: Semantic search for memory retrieval
5. **Multi-tenant Auth**: API keys per service
6. **Memory Analytics**: Dashboard for memory insights
7. **Webhook Notifications**: Trigger on memory events
8. **Import/Export**: Backup and restore memories

---

## Success Metrics

- **Memory Extraction Rate**: % of messages with extractable memories
- **Memory Utilization**: % of responses that use stored memories
- **User Satisfaction**: Reduction in repeated questions
- **Response Personalization**: Improvement in response relevance

---

## Security Considerations

- Redis connections use TLS
- API keys stored in environment variables
- No PII logged to console
- Per-service data isolation via Redis keys

---

## Getting Started

1. Clone repository
2. Set environment variables:
   ```
   REDIS_URL=redis://...
   OPENAI_API_KEY=sk-...
   ```
3. `npm install && npm run dev`
4. Create a service via UI
5. Test with demo chat interface

---

*Document Version: 1.0*
*Last Updated: January 2026*
```

