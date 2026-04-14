import { Context, Bot } from 'grammy';
import { processAndUploadImage } from '../../services/mediaProcessor.js';
import { categorizeImage } from '../../services/categorizer.js';
import {
  createDump,
  getCategoryByName,
  createPendingMessage,
  isDumpExists,
  isPendingMessageExists,
} from '../../services/supabase.js';
import { DumpInsert } from '../../types/index.js';
import { askForCategory } from './shared.js';
import { flushStalePendingMessages } from '../../services/messageGrouper.js';

const CONFIDENCE_THRESHOLD = 0.7;

export function createPhotoHandler(bot: Bot) {
  return async function handlePhotoMessage(ctx: Context) {
    const photos = ctx.message?.photo;
    if (!photos || photos.length === 0) return;

    const chatId = ctx.message!.chat.id;
    const messageId = ctx.message!.message_id;

    // Skip webhook retries
    if (await isDumpExists(messageId)) return;
    if (await isPendingMessageExists(chatId, messageId)) return;

    // Flush any stale pending messages from previous interactions
    await flushStalePendingMessages(bot, chatId);

    // Telegram sends multiple sizes — pick the largest
    const photo = photos[photos.length - 1];
    const caption = ctx.message?.caption || '';
    const mediaGroupId = ctx.message?.media_group_id;

    try {
      await ctx.reply('📸 Processing image...');

      // Download, compress, and upload to Supabase
      const { url, buffer } = await processAndUploadImage(bot, photo.file_id);

      // If caption exists OR this is part of an album: process immediately
      if (caption || mediaGroupId) {
        const result = await categorizeImage(buffer, caption || undefined);

        const dump: DumpInsert = {
          content: caption || '[Image]',
          type: 'image',
          media_url: url,
          metadata: {
            width: photo.width,
            height: photo.height,
            ...(mediaGroupId ? { media_group_id: mediaGroupId } : {}),
          },
          telegram_message_id: messageId,
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
        return;
      }

      // No caption, not album: buffer for potential follow-up text
      await createPendingMessage(
        chatId,
        'image',
        url,
        { width: photo.width, height: photo.height },
        messageId
      );

      await ctx.reply(
        '📸 Image received! Send a caption within 60s, or it will be saved as-is.'
      );
    } catch (error) {
      console.error('Photo handler error:', error);
      await ctx.reply('Failed to process image. Please try again.');
    }
  };
}
