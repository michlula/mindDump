import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSetupHandler } from '../server/src/bot/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = `https://${req.headers.host}/api/webhook`;
  const setup = createSetupHandler(process.env.TELEGRAM_BOT_TOKEN!);
  await setup(url);
  res.json({ ok: true, webhook: url });
}
