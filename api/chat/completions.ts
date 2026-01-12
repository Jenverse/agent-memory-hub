import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedisClient, getServiceRedisClient, RedisKeys } from '../lib/redis.js';
import type { ServiceConfig } from '../lib/types.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  service_id?: string;
  user_id?: string;
}

interface ExtractedMemory {
  bucket_name: string;
  data: Record<string, any>;
}

const MEMORY_DELIMITER = '---MEMORY_EXTRACT---';

// Build memory extraction instructions for the system prompt
function buildMemoryExtractionPrompt(service: ServiceConfig): string {
  const buckets = service.schemas?.longTermBuckets || [];

  if (buckets.length === 0) {
    return '';
  }

  let prompt = `\n\n---\nMEMORY EXTRACTION INSTRUCTIONS:
After your response to the user, you MUST append the following delimiter and extract any memorable information:

${MEMORY_DELIMITER}
{"memories": [...]}

The memories array should contain objects with:
- "bucket_name": the name of the memory bucket
- "data": an object with fields matching the bucket schema

Available memory buckets:\n`;

  for (const bucket of buckets) {
    prompt += `\n- Bucket: "${bucket.name}"`;
    prompt += `\n  Description: ${bucket.description || 'No description'}`;
    prompt += `\n  Fields:`;
    for (const field of bucket.schema || []) {
      prompt += `\n    - ${field.name} (${field.type}${field.required ? ', required' : ''})`;
    }
  }

  prompt += `\n
EXTRACTION RULES:
1. ONLY extract information explicitly stated by the user
2. Do NOT assume or infer information
3. Include user_id in every memory if the schema has that field
4. If no memorable information in this message, return: ${MEMORY_DELIMITER}\n{"memories": []}
5. ALWAYS include the delimiter and JSON, even if memories array is empty

Example response format:
"Here's my response to you about travel planning...

${MEMORY_DELIMITER}
{"memories": [{"bucket_name": "preferences", "data": {"user_id": "123", "budget": "$3000"}}]}"
`;

  return prompt;
}

// Parse the response to extract chat content and memories
function parseResponse(content: string): { chatResponse: string; memories: ExtractedMemory[] } {
  const parts = content.split(MEMORY_DELIMITER);

  if (parts.length < 2) {
    // No delimiter found, return full content as chat response
    return { chatResponse: content.trim(), memories: [] };
  }

  const chatResponse = parts[0].trim();
  const memoryPart = parts[1].trim();

  try {
    const parsed = JSON.parse(memoryPart);
    return {
      chatResponse,
      memories: Array.isArray(parsed.memories) ? parsed.memories : []
    };
  } catch (e) {
    console.error('Failed to parse memory extraction:', e);
    return { chatResponse, memories: [] };
  }
}

// Store extracted memories in long-term storage
async function storeExtractedMemories(
  memories: ExtractedMemory[],
  userId: string,
  service: ServiceConfig
): Promise<void> {
  if (memories.length === 0) return;

  try {
    const serviceRedis = getServiceRedisClient(service);
    const timestamp = new Date().toISOString();

    for (const memory of memories) {
      // Ensure user_id is set
      memory.data.user_id = memory.data.user_id || userId;

      const memoryKey = RedisKeys.userBucket(userId, service.id, memory.bucket_name);

      // Store as a list entry with timestamp
      await serviceRedis.rpush(memoryKey, {
        ...memory.data,
        extracted_at: timestamp,
      });
    }

    console.log(`Stored ${memories.length} memories for user ${userId}`);
  } catch (error) {
    console.error('Error storing extracted memories:', error);
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    return res.status(500).json({
      success: false,
      error: 'OpenAI API key not configured on server'
    });
  }

  try {
    const {
      messages,
      model = 'gpt-4o-mini',
      temperature = 0.7,
      service_id,
      user_id
    } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    // Get service config if service_id provided
    let service: ServiceConfig | null = null;
    if (service_id) {
      const configRedis = getRedisClient();
      service = await configRedis.get<ServiceConfig>(RedisKeys.serviceConfig(service_id));
    }

    // Prepare messages with memory extraction instructions
    const modifiedMessages = [...messages];

    if (service && modifiedMessages.length > 0 && modifiedMessages[0].role === 'system') {
      // Append memory extraction instructions to system prompt
      const memoryPrompt = buildMemoryExtractionPrompt(service);
      if (memoryPrompt) {
        modifiedMessages[0] = {
          ...modifiedMessages[0],
          content: modifiedMessages[0].content + memoryPrompt
        };
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: modifiedMessages,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        error: `OpenAI API error: ${response.statusText}`,
        details: errorData
      });
    }

    const data = await response.json();
    const fullContent = data.choices[0].message.content;

    // Parse response to separate chat content from memory extraction
    const { chatResponse, memories } = parseResponse(fullContent);

    // Store extracted memories in background (don't await)
    if (service && user_id && memories.length > 0) {
      storeExtractedMemories(memories, user_id, service).catch(err => {
        console.error('Background memory storage failed:', err);
      });
    }

    // Return only the chat response to the user
    return res.status(200).json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          content: chatResponse,
        },
        usage: data.usage,
        memories_extracted: memories.length,
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

