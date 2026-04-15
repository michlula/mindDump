import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['x-cron-secret'] !== cronSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { createBot } = await import('../server/src/bot/index.js');
    const { processStaleBatches } = await import('../server/src/services/batchProcessor.js');

    const bot = createBot(process.env.TELEGRAM_BOT_TOKEN!);
    const count = await processStaleBatches(bot);

    res.json({ ok: true, processed: count });
  } catch (error) {
    console.error('Flush endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
