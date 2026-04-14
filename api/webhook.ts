import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const { createWebhookHandler } = await import('../server/src/bot/index.js');
  const handle = createWebhookHandler(process.env.TELEGRAM_BOT_TOKEN!);
  return handle(req, res);
}
