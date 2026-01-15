// Memory extraction and consolidation logic using OpenAI
// Based on AWS AgentCore Memory extraction pipeline
import type { ShortTermMemory, ShortTermEvent, LongTermMemoryRecord, MemoryType } from './types';

// Generate a unique memory record ID
function generateMemoryRecordId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'mem-';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Convert extracted data to LongTermMemoryRecord format
export function createMemoryRecord(
  memoryType: MemoryType,
  userId: string,
  content: { text?: string; structured?: Record<string, any> },
  metadata?: Record<string, string>
): LongTermMemoryRecord {
  return {
    memoryRecordId: generateMemoryRecordId(),
    memoryType,
    userId,
    content,
    createdAt: new Date().toISOString(),
    metadata,
  };
}

// Memory type definitions for extraction
const MEMORY_TYPE_DEFINITIONS: Record<MemoryType, { description: string; guidance: string; examples: string[] }> = {
  user_preferences: {
    description: 'Explicit preferences, choices, likes, dislikes, and interaction styles expressed by the USER',
    guidance: `Extract ONLY when the USER explicitly states a preference. Look for phrases like:
      - "I prefer...", "I like...", "I don't like...", "I want...", "I always..."
      - "My favorite is...", "I usually...", "I'd rather..."
      IMPORTANT: Only extract from USER messages. Assistant messages are context only.
      Do NOT infer preferences from behavior. Must be explicitly stated by the user.`,
    examples: [
      'User: "I prefer window seats" → { "text": "prefers window seats when flying" }',
      'User: "I like spicy food" → { "text": "likes spicy food" }',
      'User: "Please use dark mode" → { "text": "prefers dark mode interface" }',
    ],
  },
  semantic: {
    description: 'Facts, knowledge, and contextual information about the USER or their situation',
    guidance: `Extract factual information stated by the USER:
      - Personal facts: name, job, location, relationships
      - Context: order numbers, account IDs, project names
      - Relationships between entities
      IMPORTANT: Only extract facts the USER states about themselves.
      Do NOT include opinions or preferences here.`,
    examples: [
      'User: "I work at Acme Corp" → { "text": "works at Acme Corp" }',
      'User: "My order number is #12345" → { "structured": { "orderId": "#12345" } }',
      'User: "I have 2 kids" → { "text": "has 2 children" }',
    ],
  },
  summary: {
    description: 'Condensed summary of what happened in this conversation session',
    guidance: `Create ONE brief summary capturing:
      - Main topic/purpose of conversation
      - Key decisions or outcomes
      - Any unresolved issues
      Keep it concise (1-2 sentences). Always generate exactly one summary.`,
    examples: [
      '{ "text": "User inquired about flight options to Paris, selected a window seat on the morning flight, and completed booking successfully." }',
      '{ "text": "Troubleshooting session for login issues. Resolved by resetting password via email link." }',
    ],
  },
  episodic: {
    description: 'Structured record of significant interactions with clear intent and outcome',
    guidance: `Only extract for COMPLETED interactions with clear outcomes. Structure as:
      - scenario: What type of interaction (booking, support, inquiry, etc.)
      - intent: What the user was trying to accomplish
      - actions: Key steps taken (array)
      - outcome: Result (success, failure, partial, pending)
      Skip if conversation is just casual chat or no clear outcome.`,
    examples: [
      '{ "structured": { "scenario": "flight_booking", "intent": "book round-trip to Paris", "actions": ["searched flights", "compared prices", "selected window seat", "paid"], "outcome": "success" } }',
      '{ "structured": { "scenario": "technical_support", "intent": "fix login issue", "actions": ["verified email", "reset password", "tested login"], "outcome": "resolved" } }',
    ],
  },
};

export async function extractMemoriesFromConversation(
  messages: ShortTermMemory[] | ShortTermEvent[],
  enabledMemoryTypes: MemoryType[],
  userId: string
): Promise<LongTermMemoryRecord[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  if (messages.length === 0) {
    return [];
  }

  // Build conversation context
  const conversationText = messages
    .map((m) => {
      const role = 'role' in m ? m.role : 'user';
      const text = m.text;
      const roleLabel = role === 'USER' || role === 'user' ? 'User'
        : role === 'ASSISTANT' || role === 'agent' ? 'Assistant'
        : 'Tool';
      return `${roleLabel}: ${text}`;
    })
    .join('\n');

  // Build memory type instructions for enabled types only
  const memoryTypeInstructions = enabledMemoryTypes
    .map((type) => {
      const def = MEMORY_TYPE_DEFINITIONS[type];
      return `## ${type}
Description: ${def.description}

Guidance:
${def.guidance}

Examples:
${def.examples.map(e => `  - ${e}`).join('\n')}`;
    })
    .join('\n\n');

  const systemPrompt = `You are a memory extraction system for an AI agent. Your job is to analyze conversations and extract meaningful information from USER messages that should be remembered for future interactions.

CRITICAL RULES:
1. ONLY extract information from USER messages - Assistant messages provide context only
2. Only extract what is EXPLICITLY stated by the user, not inferred
3. Do NOT extract trivial or transient information (e.g., "user said hello", "user asked a question")
4. Each extracted memory should be USEFUL for future conversations
5. Be conservative - when in doubt, don't extract
6. Return empty arrays for categories with nothing meaningful to extract
7. Focus on: preferences, facts about the user, significant decisions, and completed interactions`;

  const userPrompt = `Analyze this conversation and extract memories from USER messages into the following categories:

${memoryTypeInstructions}

---
CONVERSATION:
${conversationText}
---

Return a JSON object with this structure:
{
${enabledMemoryTypes.map(type => `  "${type}": []  // Array of extracted items`).join(',\n')}
}

For each item, use either:
- { "text": "simple text description" } for simple facts
- { "structured": { ... } } for complex/structured data

Be selective. Only extract genuinely useful information that would help in future conversations.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2, // Lower temperature for more consistent extraction
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const extractedData = JSON.parse(data.choices[0].message.content);

    // Convert extracted data to LongTermMemoryRecord format
    const memoryRecords: LongTermMemoryRecord[] = [];

    for (const memoryType of enabledMemoryTypes) {
      const items = extractedData[memoryType];
      if (items && Array.isArray(items)) {
        for (const item of items) {
          // Skip empty or invalid items
          if (!item || (!item.text && !item.structured)) {
            continue;
          }

          const content = item.text
            ? { text: item.text }
            : { structured: item.structured };

          memoryRecords.push(createMemoryRecord(memoryType, userId, content));
        }
      }
    }

    return memoryRecords;
  } catch (error) {
    console.error('Error extracting memories:', error);
    throw error;
  }
}

// Consolidation result for a single memory
export interface ConsolidationResult {
  action: 'add' | 'skip' | 'conflict';
  newMemory: LongTermMemoryRecord;
  conflictingMemoryId?: string;  // ID of existing memory to delete if conflict
  reason?: string;
}

// Consolidate new memories with existing ones
// Returns: which memories to add, skip, or replace (delete old + add new)
export async function consolidateMemories(
  newMemories: LongTermMemoryRecord[],
  existingMemories: LongTermMemoryRecord[]
): Promise<ConsolidationResult[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  if (newMemories.length === 0) {
    return [];
  }

  // If no existing memories, all new ones are just additions
  if (existingMemories.length === 0) {
    return newMemories.map(m => ({ action: 'add' as const, newMemory: m }));
  }

  // Build context for AI comparison
  const existingContext = existingMemories.map((m, i) => ({
    index: i,
    id: m.memoryRecordId,
    type: m.memoryType,
    content: m.content.text || JSON.stringify(m.content.structured),
  }));

  const newContext = newMemories.map((m, i) => ({
    index: i,
    type: m.memoryType,
    content: m.content.text || JSON.stringify(m.content.structured),
  }));

  const prompt = `You are a memory consolidation system. Compare NEW memories against EXISTING memories and determine the action for each new memory.

EXISTING MEMORIES:
${JSON.stringify(existingContext, null, 2)}

NEW MEMORIES TO CONSOLIDATE:
${JSON.stringify(newContext, null, 2)}

For each NEW memory, determine:
- "add": New information not in existing memories → ADD it
- "skip": Duplicate/same info already exists → SKIP it
- "conflict": Contradicts existing memory → DELETE old, ADD new (recency wins)

CONFLICT EXAMPLES:
- "prefers window seats" vs "prefers aisle seats" → CONFLICT (preferences changed)
- "works at Acme Corp" vs "works at Beta Inc" → CONFLICT (job changed)
- "has 2 kids" vs "has 3 kids" → CONFLICT (info updated)

NOT CONFLICTS (both can coexist):
- "likes pizza" and "likes sushi" → Both are valid preferences, ADD
- "works at Acme Corp" and "lives in NYC" → Different facts, ADD

Return a JSON array with one object per new memory:
[
  { "newIndex": 0, "action": "add" },
  { "newIndex": 1, "action": "skip", "reason": "duplicate of existing" },
  { "newIndex": 2, "action": "conflict", "existingIndex": 3, "reason": "preference changed" }
]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a memory consolidation system. Analyze memories and return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    // Handle both array and object with array property
    const decisions = Array.isArray(parsed) ? parsed : (parsed.decisions || parsed.results || []);

    const results: ConsolidationResult[] = [];

    for (const decision of decisions) {
      const newMemory = newMemories[decision.newIndex];
      if (!newMemory) continue;

      if (decision.action === 'add') {
        results.push({ action: 'add', newMemory });
      } else if (decision.action === 'skip') {
        results.push({ action: 'skip', newMemory, reason: decision.reason });
      } else if (decision.action === 'conflict') {
        const conflictingMemory = existingMemories[decision.existingIndex];
        results.push({
          action: 'conflict',
          newMemory,
          conflictingMemoryId: conflictingMemory?.memoryRecordId,
          reason: decision.reason,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error consolidating memories:', error);
    // On error, default to adding all (safer than losing data)
    return newMemories.map(m => ({ action: 'add' as const, newMemory: m }));
  }
}
