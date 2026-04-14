import { Context, Bot } from 'grammy';
import { containsUrl } from '../../services/linkPreview.js';
import { handleLinkMessage } from './link.js';
import { saveDumpWithCategorization } from './shared.js';
import { isDumpExists } from '../../services/supabase.js';
import {
  flushStalePendingMessages,
  tryMergeTextWithPendingMedia,
  flushAllPendingMessages,
} from '../../services/messageGrouper.js';

export function createTextHandler(bot: Bot) {
  return async function handleTextMessage(ctx: Context) {
    const text = ctx.message?.text;
    if (!text) return;

    const chatId = ctx.message!.chat.id;
    const messageId = ctx.message!.message_id;

    // Skip webhook retries: if this message already created a dump, skip
    if (await isDumpExists(messageId)) return;

    // Flush stale pending messages, get fresh ones still within window
    const freshPending = await flushStalePendingMessages(bot, chatId);

    // Skip webhook retries: if this message was already buffered as pending, skip
    if (freshPending.some(p => p.telegram_message_id === messageId)) return;

    // If there's pending content and this is NOT a URL, try to merge as description
    if (freshPending.length > 0 && !containsUrl(text)) {
      const merged = await tryMergeTextWithPendingMedia(bot, ctx, text, freshPending);
      if (merged) return;
    }

    // If there's pending content but text is a URL, flush them (URL is not a caption)
    if (freshPending.length > 0 && containsUrl(text)) {
      await flushAllPendingMessages(bot, chatId);
    }

    // Original logic: URL detection → link handler
    if (containsUrl(text)) {
      return handleLinkMessage(ctx);
    }

    // Regular text dump
    await saveDumpWithCategorization(ctx, {
      content: text,
      type: 'text',
      telegram_message_id: messageId,
    });
  };
}
