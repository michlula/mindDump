import { Context, Bot } from 'grammy';
import { processAndUploadVideo } from '../../services/mediaProcessor.js';
import { saveDumpWithCategorization } from './shared.js';
import { DumpInsert } from '../../types/index.js';

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export function createVideoHandler(bot: Bot) {
  return async function handleVideoMessage(ctx: Context) {
    const video = ctx.message?.video;
    if (!video) return;

    const caption = ctx.message?.caption || '';

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

      const dump: DumpInsert = {
        content: caption || '[Video]',
        type: 'video',
        media_url: url,
        metadata: {
          duration: video.duration,
          width: video.width,
          height: video.height,
          file_size: video.file_size,
        },
        telegram_message_id: ctx.message?.message_id,
      };

      await saveDumpWithCategorization(ctx, dump);
    } catch (error) {
      console.error('Video handler error:', error);
      await ctx.reply('Failed to process video. Please try again.');
    }
  };
}
