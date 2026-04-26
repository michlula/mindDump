import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const { createBot, webhookCallback } = await import('../server/src/bot/index.js');
  const { processStaleBatches } = await import('../server/src/services/batchProcessor.js');

  const bot = createBot(process.env.TELEGRAM_BOT_TOKEN!);
  const handle = webhookCallback(bot, 'https');
  await handle(req, res);

  // Opportunistically process any stale batches (>3s old) before the function terminates
  await processStaleBatches(bot).catch((err: unknown) =>
    console.error('processStaleBatches error:', err)
  );
}
