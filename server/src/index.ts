import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import express from 'express';
import { webhookCallback } from 'grammy';
import { createBot } from './bot/index.js';

const PORT = process.env.PORT || 3000;

async function main() {
  // Validate required env vars
  const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'GEMINI_API_KEY',
  ];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`Missing required environment variable: ${varName}`);
      console.error('Copy .env.example to .env and fill in the values.');
      process.exit(1);
    }
  }

  const bot = createBot(process.env.TELEGRAM_BOT_TOKEN!);
  const app = express();

  if (process.env.WEBHOOK_URL) {
    // Production: use webhook
    app.use(express.json());
    app.use('/webhook', webhookCallback(bot, 'express'));

    await bot.api.setWebhook(process.env.WEBHOOK_URL + '/webhook');
    console.log(`Webhook set to ${process.env.WEBHOOK_URL}/webhook`);
  } else {
    // Development: use long polling
    await bot.start({
      onStart: (botInfo) => {
        console.log(`Bot @${botInfo.username} started with long polling`);
      },
    });
  }

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    bot.stop();
    process.exit(0);
  });
}

main().catch(console.error);
