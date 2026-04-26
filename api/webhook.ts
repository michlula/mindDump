import type { IncomingMessage, ServerResponse } from 'http';
import { waitUntil } from '@vercel/functions';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const { createBot, webhookCallback } = await import('../server/src/bot/index.js');
  const { processStaleBatches } = await import('../server/src/services/batchProcessor.js');

  const bot = createBot(process.env.TELEGRAM_BOT_TOKEN!);
  const handle = webhookCallback(bot, 'https');
  await handle(req, res);

  // Process any already-stale batches (from earlier messages >3s ago)
  await processStaleBatches(bot).catch((err: unknown) =>
    console.error('processStaleBatches error:', err)
  );

  // Keep function alive to process the batch that was just saved
  // Wait 5s to pass the 3s stale window with margin for rapid messages
  waitUntil(
    new Promise<void>(resolve => setTimeout(resolve, 5000))
      .then(() => processStaleBatches(bot))
      .catch((err: unknown) => console.error('Delayed processStaleBatches error:', err))
  );
}
