import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
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
    const { messages, model = 'gpt-4o-mini', temperature = 0.7 } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Messages array is required' 
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
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
    
    return res.status(200).json({
      success: true,
      data: {
        message: data.choices[0].message,
        usage: data.usage,
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

