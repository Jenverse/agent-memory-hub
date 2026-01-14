// Memory extraction logic using OpenAI
// Based on AWS AgentCore Memory schema with 4 built-in memory types
import type { ServiceConfig, ShortTermMemory, ShortTermEvent, LongTermMemoryRecord, MemoryType } from './types';

// Generate a unique memory record ID
function generateMemoryRecordId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'mem-';
  for (let i = 0; i < 40; i++) {
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

export async function extractMemoriesFromConversation(
  messages: ShortTermMemory[] | ShortTermEvent[],
  serviceConfig: ServiceConfig,
  userId: string
): Promise<LongTermMemoryRecord[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Build conversation context (support both old and new event format)
  const conversationText = messages
    .map((m) => {
      const role = 'role' in m ? m.role : 'user';
      const text = m.text;
      return `${role === 'USER' || role === 'user' ? 'User' : role === 'ASSISTANT' || role === 'agent' ? 'Assistant' : 'Tool'}: ${text}`;
    })
    .join('\n');

  // AWS AgentCore Memory: 4 built-in strategies
  const strategies = [
    {
      id: 'user_preferences',
      description: 'User preferences, choices, and interaction styles learned from conversations',
      examples: 'prefers window seats, likes Italian food, uses dark mode',
    },
    {
      id: 'semantic',
      description: 'Facts, knowledge, and contextual information extracted from conversations',
      examples: 'works at Acme Corp, order #ABC-123 relates to ticket #789',
    },
    {
      id: 'summary',
      description: 'Condensed summaries of sessions capturing key topics and decisions',
      examples: 'troubleshot software v2.1, tried restart, provided KB link',
    },
    {
      id: 'episodic',
      description: 'Structured episodes with scenario, intent, actions, and outcomes',
      examples: 'booked flight to Paris, chose window seat, successful',
    },
  ];

  const strategiesDescription = strategies
    .map((s) => `${s.id}:\n  Description: ${s.description}\n  Examples: ${s.examples}`)
    .join('\n\n');

  const prompt = `You are a memory extraction system for an AI agent using AWS AgentCore Memory.

Agent Purpose: ${serviceConfig.agentPurpose}

Memory Goals:
${serviceConfig.memoryGoals.map((g) => `- ${g}`).join('\n')}

Conversation:
${conversationText}

Extract data from this conversation and organize it into the following 4 MEMORY STRATEGIES:

${strategiesDescription}

INSTRUCTIONS:
1. user_preferences: Extract preferences, choices, and styles the user has expressed
2. semantic: Extract facts, relationships, and contextual knowledge
3. summary: Create a brief summary of what was discussed/accomplished
4. episodic: For significant interactions, capture scenario/intent/actions/outcome

Return a JSON object where each key is a strategy ID and the value is an array of extracted content.
Use "text" for simple text content, or "structured" for complex data.

Example format:
{
  "user_preferences": [
    { "text": "prefers window seats" },
    { "text": "likes Italian food" }
  ],
  "semantic": [
    { "text": "works at Acme Corp as senior engineer" },
    { "structured": { "relationship": "order #ABC-123 relates to ticket #789" } }
  ],
  "summary": [
    { "text": "discussed flight booking options, selected Paris trip for next month" }
  ],
  "episodic": [
    { "structured": { "scenario": "flight booking", "intent": "book Paris trip", "actions": ["searched flights", "selected window seat"], "outcome": "success" } }
  ]
}`;

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
          {
            role: 'system',
            content: 'You are a memory extraction system using AWS AgentCore Memory format. Extract data into the 4 strategies and return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const extractedData = JSON.parse(data.choices[0].message.content);

    // Convert extracted data to LongTermMemoryRecord format
    const memoryRecords: LongTermMemoryRecord[] = [];

    for (const memoryType of ['user_preferences', 'semantic', 'summary', 'episodic'] as MemoryType[]) {
      const items = extractedData[memoryType];
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const content = item.text
            ? { text: item.text }
            : { structured: item.structured || item };

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

