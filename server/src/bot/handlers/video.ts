import { Context, Bot } from 'grammy';
import { processAndUploadVideo } from '../../services/mediaProcessor.js';
import { saveDumpWithCategorization } from './shared.js';
import {
  createPendingMessage,
  isDumpExists,
  isPendingMessageExists,
} from '../../services/supabase.js';
import { DumpInsert } from '../../types/index.js';
import { flushStalePendingMessages } from '../../services/messageGrouper.js';

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export function createVideoHandler(bot: Bot) {
  return async function handleVideoMessage(ctx: Context) {
    const video = ctx.message?.video;
    if (!video) return;

    const chatId = ctx.message!.chat.id;
    const messageId = ctx.message!.message_id;

    // Skip webhook retries
    if (await isDumpExists(messageId)) return;
    if (await isPendingMessageExists(chatId, messageId)) return;

    // Flush any stale pending messages from previous interactions
    await flushStalePendingMessages(bot, chatId);

    const caption = ctx.message?.caption || '';
    const mediaGroupId = ctx.message?.media_group_id;

    // Warn if video is large
    if (video.file_size && video.file_size > MAX_VIDEO_SIZE) {
      await ctx.reply(
        '⚠️ This video is larger than 50MB. It may take a while to upload and uses significant storage. Proceeding anyway...'
      );
    }

    try {
      await ctx.reply('🎬 Processing video...');

      const url = await processAndUploadVideo(
        bot,
        video.file_id,
        video.file_name
      );

      // If caption exists OR this is part of an album: process immediately
      if (caption || mediaGroupId) {
        const dump: DumpInsert = {
          content: caption || '[Video]',
          type: 'video',
          media_url: url,
          metadata: {
            duration: video.duration,
            width: video.width,
            height: video.height,
            file_size: video.file_size,
            ...(mediaGroupId ? { media_group_id: mediaGroupId } : {}),
          },
          telegram_message_id: messageId,
        };

        await saveDumpWithCategorization(ctx, dump);
        return;
      }

      // No caption, not album: buffer for potential follow-up text
      await createPendingMessage(
        chatId,
        'video',
        url,
        {
          duration: video.duration,
          width: video.width,
          height: video.height,
          file_size: video.file_size,
        },
        messageId
      );

      await ctx.reply(
        '🎬 Video received! Send a caption within 60s, or it will be saved as-is.'
      );
    } catch (error) {
      console.error('Video handler error:', error);
      await ctx.reply('Failed to process video. Please try again.');
    }
  };
}
