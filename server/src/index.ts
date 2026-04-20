import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env BEFORE any other imports that use env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Dynamic imports — must happen after dotenv.config()
const { default: express } = await import('express');
const { webhookCallback } = await import('grammy');
const { createBot } = await import('./bot/index.js');
const { processStaleBatches } = await import('./services/batchProcessor.js');

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

    // Local dev: poll for stale batches every 3s (safety net)
    setInterval(async () => {
      try {
        const count = await processStaleBatches(bot);
        if (count > 0) console.log(`Batch processor: processed ${count} chats`);
      } catch (error) {
        console.error('Batch processor interval error:', error);
      }
    }, 3_000);
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
