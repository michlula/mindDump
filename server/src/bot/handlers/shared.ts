import { Context, InlineKeyboard } from 'grammy';
import { categorizeContent } from '../../services/categorizer.js';
import {
  createDump,
  createPendingCategorization,
  getCategoryByName,
  getCategories,
} from '../../services/supabase.js';
import { DumpInsert } from '../../types/index.js';

const CONFIDENCE_THRESHOLD = 0.7;

const TYPE_ICONS: Record<string, string> = {
  text: '📝',
  link: '🔗',
  image: '📸',
  video: '🎬',
};

export async function saveDumpWithCategorization(
  ctx: Context,
  dump: DumpInsert
) {
  try {
    const result = await categorizeContent(dump.content, dump.type);

    if (result.confidence >= CONFIDENCE_THRESHOLD) {
      // Auto-categorize
      const category = await getCategoryByName(result.category);
      if (category) {
        dump.category_id = category.id;
      }

      const saved = await createDump(dump);
      const icon = TYPE_ICONS[dump.type] || '📌';
      const catIcon = category?.icon || '📌';
      const catName = category?.name || 'General';

      await ctx.reply(`${icon} Saved to ${catIcon} *${catName}*!`, {
        parse_mode: 'Markdown',
      });
    } else {
      // Ask user to pick a category
      await askForCategory(ctx, dump);
    }
  } catch (error) {
    console.error('Save dump error:', error);
    // Fallback: save to General without AI
    try {
      const general = await getCategoryByName('General');
      dump.category_id = general?.id;
      await createDump(dump);
      await ctx.reply(`${TYPE_ICONS[dump.type] || '📌'} Saved to 📝 *General*!`, {
        parse_mode: 'Markdown',
      });
    } catch (fallbackError) {
      console.error('Fallback save error:', fallbackError);
      await ctx.reply('Failed to save. Please try again.');
    }
  }
}

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
