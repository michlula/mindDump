import { Bot, Context, InlineKeyboard } from 'grammy';
import {
  createPendingCategorization,
  getCategories,
} from '../../services/supabase.js';
import { DumpInsert } from '../../types/index.js';

export const CONFIDENCE_THRESHOLD = 0.7;

export const TYPE_ICONS: Record<string, string> = {
  text: '📝',
  link: '🔗',
  image: '📸',
  video: '🎬',
};

export async function askForCategory(ctx: Context, dump: DumpInsert) {
  const categories = await getCategories();

  const keyboard = new InlineKeyboard();
  categories.forEach((cat, i) => {
    keyboard.text(`${cat.icon} ${cat.name}`, `cat:${cat.id}`);
    // 3 buttons per row
    if ((i + 1) % 3 === 0 && i < categories.length - 1) {
      keyboard.row();
    }
  });

  const message = await ctx.reply('Which category?', {
    reply_markup: keyboard,
  });

  // Store pending categorization in DB
  await createPendingCategorization(
    ctx.chat!.id,
    message.message_id,
    dump
  );
}

export async function askForCategoryViaBot(
  bot: Bot,
  chatId: number,
  dump: DumpInsert
) {
  const categories = await getCategories();

  const keyboard = new InlineKeyboard();
  categories.forEach((cat, i) => {
    keyboard.text(`${cat.icon} ${cat.name}`, `cat:${cat.id}`);
    if ((i + 1) % 3 === 0 && i < categories.length - 1) {
      keyboard.row();
    }
  });

  const message = await bot.api.sendMessage(chatId, 'Which category?', {
    reply_markup: keyboard,
  });

  await createPendingCategorization(chatId, message.message_id, dump);
}
