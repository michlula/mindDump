import { Bot } from 'grammy';
import {
  getStaleBatchChatIds,
  claimPendingBatch,
  createDump,
  getCategoryByName,
} from './supabase.js';
import { processAndUploadImage, processAndUploadVideo } from './mediaProcessor.js';
import { processBatch } from './categorizer.js';
import { askForCategoryViaBot, CONFIDENCE_THRESHOLD, TYPE_ICONS } from '../bot/handlers/shared.js';
import { BatchMessage, DumpInsert, PendingMessage } from '../types/index.js';

async function buildBatchMessage(
  bot: Bot,
  pending: PendingMessage
): Promise<BatchMessage> {
  const msg: BatchMessage = { ...pending };

  if (pending.message_type === 'image' && pending.telegram_file_id) {
    try {
      const { url, buffer } = await processAndUploadImage(bot, pending.telegram_file_id);
      msg.image_buffer = buffer;
      msg.media_url = url;
    } catch (error) {
      console.error('Failed to download/upload image:', error);
    }
  } else if (pending.message_type === 'video' && pending.telegram_file_id) {
    try {
      const fileName = (pending.metadata as Record<string, unknown>)?.file_name as string | undefined;
      const url = await processAndUploadVideo(bot, pending.telegram_file_id, fileName);
      msg.media_url = url;
    } catch (error) {
      console.error('Failed to download/upload video:', error);
    }
  }

  return msg;
}

async function processChatBatch(bot: Bot, chatId: number): Promise<void> {
  const pendingMessages = await claimPendingBatch(chatId);
  if (pendingMessages.length === 0) return;

  console.log(`Processing batch of ${pendingMessages.length} messages for chat ${chatId}`);

  // Download and upload media in parallel
  const batchMessages = await Promise.all(
    pendingMessages.map((p) => buildBatchMessage(bot, p))
  );

  // AI grouping + titles + categories
  const result = await processBatch(batchMessages);

  // Create dumps for each group
  for (const group of result.groups) {
    try {
      const groupMessages = group.message_indices.map((i) => batchMessages[i]);

      // Determine primary content and media
      const imageMsg = groupMessages.find((m) => m.message_type === 'image' && m.media_url);
      const videoMsg = groupMessages.find((m) => m.message_type === 'video' && m.media_url);
      const textParts = groupMessages
        .filter((m) => m.content)
        .map((m) => m.content!);

      const content = group.title || textParts.join('\n') || '[No content]';
      const description = textParts.join('\n') || undefined;

      const dump: DumpInsert = {
        content,
        type: group.type,
        metadata: {
          title: group.title,
          ...(description && description !== content ? { description } : {}),
          ...(groupMessages.length > 1 ? { grouped_messages: groupMessages.length } : {}),
        },
        telegram_message_id: groupMessages[0].telegram_message_id ?? undefined,
      };

      if (imageMsg?.media_url) {
        dump.media_url = imageMsg.media_url;
      } else if (videoMsg?.media_url) {
        dump.media_url = videoMsg.media_url;
      }

      // Merge metadata from messages (dimensions, OG data, etc.)
      for (const m of groupMessages) {
        if (m.metadata && Object.keys(m.metadata).length > 0) {
          dump.metadata = { ...dump.metadata, ...m.metadata };
          // Re-apply title since message metadata might overwrite
          (dump.metadata as Record<string, unknown>).title = group.title;
        }
      }

      if (group.confidence >= CONFIDENCE_THRESHOLD) {
        const category = await getCategoryByName(group.category);
        if (category) {
          dump.category_id = category.id;
        }

        await createDump(dump);
        const icon = TYPE_ICONS[group.type] || '📌';
        const catIcon = category?.icon || '📌';
        const catName = category?.name || 'General';
        await bot.api.sendMessage(
          chatId,
          `${icon} *${group.title}* → ${catIcon} *${catName}*`,
          { parse_mode: 'Markdown' }
        );
      } else {
        // Low confidence — ask user
        await askForCategoryViaBot(bot, chatId, dump);
      }
    } catch (error) {
      console.error('Error creating dump for group:', error);
    }
  }
}

export async function processStaleBatches(bot: Bot): Promise<number> {
  try {
    const chatIds = await getStaleBatchChatIds();
    if (chatIds.length === 0) return 0;

    console.log(`Found ${chatIds.length} chats with stale batches`);

    for (const chatId of chatIds) {
      try {
        await processChatBatch(bot, chatId);
      } catch (error) {
        console.error(`Error processing batch for chat ${chatId}:`, error);
      }
    }

    return chatIds.length;
  } catch (error) {
    console.error('Error in processStaleBatches:', error);
    return 0;
  }
}
