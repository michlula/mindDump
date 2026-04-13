import { Context } from 'grammy';
import { processAndUploadImage } from '../../services/mediaProcessor.js';
import { categorizeImage } from '../../services/categorizer.js';
import {
  createDump,
  getCategoryByName,
  getCategories,
} from '../../services/supabase.js';
import { DumpInsert } from '../../types/index.js';
import { askForCategory } from './shared.js';
import { Bot } from 'grammy';

const CONFIDENCE_THRESHOLD = 0.7;

export function createPhotoHandler(bot: Bot) {
  return async function handlePhotoMessage(ctx: Context) {
    const photos = ctx.message?.photo;
    if (!photos || photos.length === 0) return;

    // Telegram sends multiple sizes — pick the largest
    const photo = photos[photos.length - 1];
    const caption = ctx.message?.caption || '';

    try {
      await ctx.reply('📸 Processing image...');

      // Download, compress, and upload to Supabase
      const { url, buffer } = await processAndUploadImage(bot, photo.file_id);

      // AI categorization using vision
      const result = await categorizeImage(buffer, caption || undefined);

      const dump: DumpInsert = {
        content: caption || '[Image]',
        type: 'image',
        media_url: url,
        metadata: {
          width: photo.width,
          height: photo.height,
        },
        telegram_message_id: ctx.message?.message_id,
      };

      if (result.confidence >= CONFIDENCE_THRESHOLD) {
        const category = await getCategoryByName(result.category);
        if (category) {
          dump.category_id = category.id;
        }

        await createDump(dump);
        const catIcon = category?.icon || '📌';
        const catName = category?.name || 'General';
        await ctx.reply(`📸 Saved to ${catIcon} *${catName}*!`, {
          parse_mode: 'Markdown',
        });
      } else {
        await askForCategory(ctx, dump);
      }
    } catch (error) {
      console.error('Photo handler error:', error);
      await ctx.reply('Failed to process image. Please try again.');
    }
  };
}
