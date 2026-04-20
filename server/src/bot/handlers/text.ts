import { Context, Bot } from 'grammy';
import { containsUrl, extractUrls, fetchLinkPreview } from '../../services/linkPreview.js';
import {
  isDumpExists,
  isPendingMessageExists,
  insertPendingMessage,
} from '../../services/supabase.js';
import { scheduleBatchCheck } from '../../services/batchProcessor.js';

export function createTextHandler(bot: Bot) {
  return async function handleTextMessage(ctx: Context) {
    const text = ctx.message?.text;
    if (!text) return;

    const chatId = ctx.message!.chat.id;
    const messageId = ctx.message!.message_id;

    // Dedup: skip if already processed
    if (await isDumpExists(messageId)) return;
    if (await isPendingMessageExists(chatId, messageId)) return;

    try {
      if (containsUrl(text)) {
        // Link message — fetch OG metadata (with short timeout)
        const urls = extractUrls(text);
        const url = urls[0];
        let metadata: Record<string, unknown> = { url };

        try {
          const preview = await fetchLinkPreview(url);
          metadata = preview as unknown as Record<string, unknown>;
        } catch (error) {
          console.error('OG fetch failed (non-fatal):', error);
        }

        await insertPendingMessage({
          telegram_chat_id: chatId,
          telegram_message_id: messageId,
          message_type: 'link',
          content: text,
          metadata,
        });
      } else {
        // Plain text message
        await insertPendingMessage({
          telegram_chat_id: chatId,
          telegram_message_id: messageId,
          message_type: 'text',
          content: text,
        });
      }
    } catch (error) {
      console.error('Failed to save pending text:', error);
      return;
    }

    // Schedule batch check after stale window expires
    scheduleBatchCheck(bot, chatId);
  };
}
