import { Bot, webhookCallback } from 'grammy';
import { startCommand } from './commands/start.js';
import { categoriesCommand } from './commands/categories.js';
import { recentCommand } from './commands/recent.js';
import { createTextHandler } from './handlers/text.js';
import { createPhotoHandler } from './handlers/photo.js';
import { createVideoHandler } from './handlers/video.js';
import { handleCallbackQuery } from './handlers/callback.js';

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  // Commands
  bot.command('start', startCommand);
  bot.command('help', startCommand); // same as start
  bot.command('categories', categoriesCommand);
  bot.command('recent', recentCommand);

  // Callback queries (inline keyboard button presses)
  bot.on('callback_query:data', handleCallbackQuery);

  // Message handlers — order matters (photo/video before text)
  bot.on('message:photo', createPhotoHandler(bot));
  bot.on('message:video', createVideoHandler(bot));
  bot.on('message:text', createTextHandler(bot));

  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}

export function createWebhookHandler(token: string) {
  const bot = createBot(token);
  return webhookCallback(bot, 'https');
}

export function createSetupHandler(token: string) {
  return async (url: string) => {
    const bot = new Bot(token);
    await bot.api.setWebhook(url);
  };
}
