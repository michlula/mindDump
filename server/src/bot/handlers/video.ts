import { Context, Bot } from 'grammy';
import {
  isDumpExists,
  isPendingMessageExists,
  insertPendingMessage,
} from '../../services/supabase.js';
import { scheduleBatchCheck } from '../../services/batchProcessor.js';

export function createVideoHandler(bot: Bot) {
  return async function handleVideoMessage(ctx: Context) {
    const video = ctx.message?.video;
    if (!video) return;

    const chatId = ctx.message!.chat.id;
    const messageId = ctx.message!.message_id;

    // Dedup: skip if already processed
    if (await isDumpExists(messageId)) return;
    if (await isPendingMessageExists(chatId, messageId)) return;

    const caption = ctx.message?.caption || '';

    try {
      await insertPendingMessage({
        telegram_chat_id: chatId,
        telegram_message_id: messageId,
        message_type: 'video',
        content: caption || undefined,
        telegram_file_id: video.file_id,
        metadata: {
          duration: video.duration,
          width: video.width,
          height: video.height,
          file_size: video.file_size,
          file_name: video.file_name,
        },
      });
    } catch (error) {
      console.error('Failed to save pending video:', error);
      return;
    }

    // Schedule batch check after stale window expires
    scheduleBatchCheck(bot, chatId);
  };
}
