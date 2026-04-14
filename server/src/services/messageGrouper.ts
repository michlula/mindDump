import { Bot, Context } from 'grammy';
import {
  getPendingMessages,
  deletePendingMessage,
  createDump,
  getCategoryByName,
} from './supabase.js';
import { categorizeImage, categorizeContent } from './categorizer.js';
import { PendingMessage, DumpInsert } from '../types/index.js';
import { saveDumpWithCategorization, askForCategory } from '../bot/handlers/shared.js';

const GROUP_WINDOW_MS = 60 * 1000; // 60 seconds

function isStale(pending: PendingMessage): boolean {
  const age = Date.now() - new Date(pending.created_at).getTime();
  return age > GROUP_WINDOW_MS;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

const CONFIDENCE_THRESHOLD = 0.7;

async function flushPendingMessage(
  bot: Bot,
  pending: PendingMessage
): Promise<void> {
  try {
    const isImage = pending.media_type === 'image';
    const fallbackContent = isImage ? '[Image]' : '[Video]';

    const dump: DumpInsert = {
      content: fallbackContent,
      type: pending.media_type,
      media_url: pending.media_url,
      metadata: pending.media_metadata,
      telegram_message_id: pending.telegram_message_id ?? undefined,
    };

    // Use text-based categorization for flush (fast, avoids Vercel 10s timeout)
    const result = await categorizeContent(fallbackContent, pending.media_type);
    if (result.confidence >= CONFIDENCE_THRESHOLD) {
      const category = await getCategoryByName(result.category);
      if (category) dump.category_id = category.id;
    }

    if (!dump.category_id) {
      const general = await getCategoryByName('General');
      if (general) dump.category_id = general.id;
    }

    await createDump(dump);

    const icon = isImage ? '📸' : '🎬';
    await bot.api.sendMessage(
      pending.telegram_chat_id,
      `${icon} Saved ${pending.media_type} (no caption received).`
    );
  } catch (error) {
    console.error('Error flushing pending message:', error);
  } finally {
    await deletePendingMessage(pending.id);
  }
}

/**
 * Flush stale pending messages (older than GROUP_WINDOW).
 * Returns the fresh (non-stale) pending messages still within window.
 */
export async function flushStalePendingMessages(
  bot: Bot,
  chatId: number
): Promise<PendingMessage[]> {
  const allPending = await getPendingMessages(chatId);

  const stale: PendingMessage[] = [];
  const fresh: PendingMessage[] = [];

  for (const pending of allPending) {
    if (isStale(pending)) {
      stale.push(pending);
    } else {
      fresh.push(pending);
    }
  }

  if (stale.length > 0) {
    await Promise.all(stale.map((p) => flushPendingMessage(bot, p)));
  }

  return fresh;
}

/**
 * Try to merge a text message with the most recent pending media message.
 * Flushes any older pending messages as standalone dumps.
 * Returns true if merge happened.
 */
export async function tryMergeTextWithPendingMedia(
  bot: Bot,
  ctx: Context,
  text: string,
  freshPending: PendingMessage[]
): Promise<boolean> {
  if (freshPending.length === 0) return false;

  // Take the most recent pending message
  const pending = freshPending[freshPending.length - 1];

  // Flush any older pending messages as standalone
  for (let i = 0; i < freshPending.length - 1; i++) {
    await flushPendingMessage(bot, freshPending[i]);
  }

  try {
    const dump: DumpInsert = {
      content: text,
      type: pending.media_type,
      media_url: pending.media_url,
      metadata: pending.media_metadata,
      telegram_message_id: pending.telegram_message_id ?? undefined,
    };

    await deletePendingMessage(pending.id);

    if (pending.media_type === 'image') {
      // Re-fetch image for vision categorization with caption
      const buffer = await fetchImageBuffer(pending.media_url);
      const result = await categorizeImage(buffer, text);

      if (result.confidence >= CONFIDENCE_THRESHOLD) {
        const category = await getCategoryByName(result.category);
        if (category) dump.category_id = category.id;
        await createDump(dump);
        const catIcon = category?.icon || '📌';
        const catName = category?.name || 'General';
        await ctx.reply(`📸 Saved to ${catIcon} *${catName}*!`, {
          parse_mode: 'Markdown',
        });
      } else {
        await askForCategory(ctx, dump);
      }
    } else {
      // Video: use text-based categorization via shared handler
      await saveDumpWithCategorization(ctx, dump);
    }

    return true;
  } catch (error) {
    console.error('Error merging text with pending media:', error);
    return false;
  }
}

/**
 * Force-flush all pending messages for a chat (used when incoming text is a URL).
 */
export async function flushAllPendingMessages(
  bot: Bot,
  chatId: number
): Promise<void> {
  const allPending = await getPendingMessages(chatId);
  if (allPending.length > 0) {
    await Promise.all(allPending.map((p) => flushPendingMessage(bot, p)));
  }
}
