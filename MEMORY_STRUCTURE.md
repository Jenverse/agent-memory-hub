# Memory Structure Guide

## Overview

The Agent Memory Hub uses a two-tier memory system: **Short-Term Memory** (conversation logs) and **Long-Term Memory** (extracted knowledge).

---

## 📝 Short-Term Memory (Structured)

Short-term memory stores raw conversation data in a simple, consistent format.

### Schema

```typescript
{
  user_id: string;      // Unique identifier for the user
  session_id: string;   // Unique identifier for the conversation session
  role: 'user' | 'agent'; // Who sent the message
  text: string;         // The actual message content
  timestamp?: string;   // When the message was sent
  metadata?: object;    // Optional additional data
}
```

### Example

```json
[
  {
    "user_id": "user123",
    "session_id": "session_456",
    "role": "user",
    "text": "I want to plan a trip to Paris",
    "timestamp": "2024-01-08T10:30:00Z"
  },
  {
    "user_id": "user123",
    "session_id": "session_456",
    "role": "agent",
    "text": "I'd love to help you plan your Paris trip! What's your budget?",
    "timestamp": "2024-01-08T10:30:05Z"
  }
]
```

---

## 🧠 Long-Term Memory (Mixed: Unstructured + Structured)

Long-term memory stores extracted knowledge in organized buckets. Some buckets are **unstructured** (free-form text), while others are **structured** (defined schemas).

### Unstructured Buckets

**Purpose:** Store information that doesn't fit into predefined categories.

**Example: `generic_memory`**

```json
{
  "generic_memory": [
    {
      "text": "User loves trying local street food when traveling",
      "timestamp": "2024-01-08T10:35:00Z"
    },
    {
      "text": "User prefers morning flights because they sleep better on planes",
      "timestamp": "2024-01-08T10:36:00Z"
    }
  ]
}
```

### Structured Buckets

**Purpose:** Store specific, categorized information with defined fields.

**Example: `preferences`**

```json
{
  "preferences": [
    {
      "budget_range": "$3000-5000",
      "preferred_airlines": ["Delta", "United"],
      "seat_preference": "window",
      "dietary_restrictions": ["vegetarian"],
      "accommodation_type": "boutique hotels"
    }
  ]
}
```

**Example: `facts`**

```json
{
  "facts": [
    {
      "fact_type": "occupation",
      "fact_value": "software engineer",
      "context": "mentioned during conversation about work travel"
    },
    {
      "fact_type": "home_city",
      "fact_value": "San Francisco"
    }
  ]
}
```

**Example: `past_trips`**

```json
{
  "past_trips": [
    {
      "destination": "Tokyo",
      "trip_dates": "March 2023",
      "highlights": ["Tsukiji Market", "Mount Fuji", "Shibuya"],
      "rating": 5
    },
    {
      "destination": "Barcelona",
      "trip_dates": "July 2023",
      "highlights": ["Sagrada Familia", "Park Güell"],
      "rating": 4
    }
  ]
}
```

---

## 🔄 How It Works

### 1. **User Chats with Agent**
- Messages stored in short-term memory
- Each message tagged with `role` (user/agent)

### 2. **Cron Job Runs (Every 5 Minutes)**
- Reads conversation from short-term memory
- Uses AI to extract meaningful information

### 3. **AI Categorizes Data**
- **Structured data** → Goes into specific buckets (preferences, facts, past_trips)
- **Unstructured data** → Goes into generic_memory bucket

### 4. **Next Conversation**
- Agent loads all long-term memories
- Uses them to personalize responses

---

## 🎯 When to Use Each Type

### Use **Unstructured** (`generic_memory`) for:
- ✅ Casual mentions that don't fit categories
- ✅ Preferences that are too specific for structured fields
- ✅ Contextual information
- ✅ Anecdotes or stories

### Use **Structured** buckets for:
- ✅ Repeatable data (preferences, facts)
- ✅ Information you want to query/filter
- ✅ Data with clear categories
- ✅ Information that needs validation

---

## 📊 Complete Example

**Conversation:**
> User: "I'm planning a trip to Italy. I'm a vegetarian and I love art museums. My budget is around $4000."
> 
> Agent: "Great! Italy has amazing vegetarian food and world-class museums. When are you thinking of going?"

**Extracted Memories:**

```json
{
  "generic_memory": [
    {
      "text": "User loves art museums"
    }
  ],
  "preferences": [
    {
      "budget_range": "$4000",
      "dietary_restrictions": ["vegetarian"]
    }
  ],
  "facts": [
    {
      "fact_type": "interest",
      "fact_value": "art museums"
    }
  ]
}
```

---

## 🛠️ Customizing Your Schema

Edit `src/pages/Dashboard.tsx` to modify the Travel Agent's memory buckets:

1. **Add new unstructured bucket:**
   ```typescript
   {
     id: "my-bucket",
     name: "my_bucket",
     description: "Description here",
     isUnstructured: true,
     schema: [
       { id: "1", name: "text", type: "string", required: true }
     ]
   }
   ```

2. **Add new structured bucket:**
   ```typescript
   {
     id: "my-structured-bucket",
     name: "my_structured_bucket",
     description: "Description here",
     schema: [
       { id: "1", name: "field1", type: "string", required: true },
       { id: "2", name: "field2", type: "number", required: false }
     ]
   }
   ```

---

**Happy memory building!** 🚀

