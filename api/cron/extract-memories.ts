import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ApiResponse } from '../../lib/types.js';

/**
 * DEPRECATED: Memory extraction now happens in real-time on every message.
 * See: api/memory/short-term/store.ts
 *
 * This endpoint is kept as a placeholder but does nothing.
 * Memory extraction is triggered automatically when events are stored.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ApiResponse>
) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  // Memory extraction is now real-time, triggered on every message
  // This cron job is deprecated
  return res.status(200).json({
    success: true,
    data: {
      message: 'Memory extraction is now real-time. This cron job is deprecated.',
      note: 'Extraction happens automatically when events are stored via POST /api/memory/short-term/store',
    },
  });
}

