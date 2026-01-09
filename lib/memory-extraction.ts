// Memory extraction logic using OpenAI
import type { ServiceConfig, ShortTermMemory } from './types';

export async function extractMemoriesFromConversation(
  messages: ShortTermMemory[],
  serviceConfig: ServiceConfig
): Promise<Record<string, any[]>> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  // Build conversation context
  const conversationText = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.text}`)
    .join('\n');

  // Separate unstructured and structured buckets
  const unstructuredBuckets = serviceConfig.schemas.longTermBuckets.filter(b => b.isUnstructured);
  const structuredBuckets = serviceConfig.schemas.longTermBuckets.filter(b => !b.isUnstructured);

  // Build extraction prompt
  const structuredDescription = structuredBuckets
    .map((bucket) => {
      const fields = bucket.schema
        .map((field) => `  - ${field.name} (${field.type}${field.required ? ', required' : ''})`)
        .join('\n');
      return `${bucket.name}:\n  Description: ${bucket.description}\n  Fields:\n${fields}`;
    })
    .join('\n\n');

  const unstructuredDescription = unstructuredBuckets.length > 0
    ? `\n\nUNSTRUCTURED BUCKETS (for information that doesn't fit structured categories):\n` +
      unstructuredBuckets
        .map((bucket) => `${bucket.name}: ${bucket.description}`)
        .join('\n')
    : '';

  const prompt = `You are a memory extraction system for an AI agent.

Agent Purpose: ${serviceConfig.agentPurpose}

Memory Goals:
${serviceConfig.memoryGoals.map((g) => `- ${g}`).join('\n')}

Conversation:
${conversationText}

Extract data from this conversation and organize it into the following memory buckets:

STRUCTURED BUCKETS (extract specific fields):
${structuredDescription}
${unstructuredDescription}

INSTRUCTIONS:
1. For STRUCTURED buckets: Extract data that matches the defined schema fields
2. For UNSTRUCTURED buckets: Extract relevant information as free-form text entries
3. Only include buckets where you found relevant information
4. For structured buckets, ensure all required fields are present
5. For unstructured buckets, create text entries for information that doesn't fit structured categories

Return a JSON object where each key is a bucket name and the value is an array of objects.

Example format:
{
  "preferences": [
    {
      "budget_range": "$3000-5000",
      "dietary_restrictions": ["vegetarian"]
    }
  ],
  "facts": [
    {
      "fact_type": "occupation",
      "fact_value": "software engineer"
    }
  ],
  "generic_memory": [
    {
      "text": "User mentioned they love trying local street food when traveling"
    },
    {
      "text": "User prefers morning flights because they sleep better on planes"
    }
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
            content: 'You are a memory extraction system. Extract structured data from conversations and return valid JSON only.',
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

    return extractedData;
  } catch (error) {
    console.error('Error extracting memories:', error);
    throw error;
  }
}

