import { Context, Bot } from 'grammy';
import {
  isDumpExists,
  isPendingMessageExists,
  insertPendingMessage,
} from '../../services/supabase.js';
import { scheduleBatchCheck } from '../../services/batchProcessor.js';

export function createPhotoHandler(bot: Bot) {
  return async function handlePhotoMessage(ctx: Context) {
    const photos = ctx.message?.photo;
    if (!photos || photos.length === 0) return;

    const chatId = ctx.message!.chat.id;
    const messageId = ctx.message!.message_id;

    // Dedup: skip if already processed
    if (await isDumpExists(messageId)) return;
    if (await isPendingMessageExists(chatId, messageId)) return;

    // Telegram sends multiple sizes — pick the largest
    const photo = photos[photos.length - 1];
    const caption = ctx.message?.caption || '';

    try {
      await insertPendingMessage({
        telegram_chat_id: chatId,
        telegram_message_id: messageId,
        message_type: 'image',
        content: caption || undefined,
        telegram_file_id: photo.file_id,
        metadata: {
          width: photo.width,
          height: photo.height,
        },
      });
    } catch (error) {
      console.error('Failed to save pending photo:', error);
      return;
    }

    // Schedule batch check after stale window expires
    scheduleBatchCheck(bot, chatId);
  };
}
