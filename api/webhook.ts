import { createWebhookHandler } from '../server/src/bot/index.js';

export default createWebhookHandler(process.env.TELEGRAM_BOT_TOKEN!);
