import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { createSetupHandler } = await import('../server/src/bot/index.js');
  const url = `https://${req.headers.host}/api/webhook`;
  const setup = createSetupHandler(process.env.TELEGRAM_BOT_TOKEN!);
  await setup(url);
  res.json({ ok: true, webhook: url });
}
