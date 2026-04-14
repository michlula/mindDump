import { Context } from 'grammy';
import { extractUrls, fetchLinkPreview } from '../../services/linkPreview.js';
import { saveDumpWithCategorization } from './shared.js';
import { createPendingMessage } from '../../services/supabase.js';
import { DumpInsert } from '../../types/index.js';

export async function handleLinkMessage(ctx: Context) {
  const text = ctx.message?.text || ctx.message?.caption || '';
  const urls = extractUrls(text);

  if (urls.length === 0) return;

  try {
    const url = urls[0];

    await ctx.reply('🔗 Fetching link preview...');

    const metadata = await fetchLinkPreview(url);

    // Check if this is a bare URL (no additional text beyond the URL itself)
    const textWithoutUrls = text.replace(/https?:\/\/[^\s<>'"]+/gi, '').trim();
    const isBareUrl = textWithoutUrls.length === 0;

    if (isBareUrl) {
      // Bare URL — buffer for potential follow-up description
      const chatId = ctx.message!.chat.id;

      await createPendingMessage(
        chatId,
        'link',
        url,
        metadata as unknown as Record<string, unknown>,
        ctx.message?.message_id
      );

      await ctx.reply(
        '🔗 Link saved! Send a description within 60s, or it will be saved as-is.'
      );
      return;
    }

    // Has additional text — save immediately with full context
    const dump: DumpInsert = {
      content: text,
      type: 'link',
      metadata: metadata as unknown as Record<string, unknown>,
      telegram_message_id: ctx.message?.message_id,
    };

    await saveDumpWithCategorization(ctx, dump);
  } catch (error) {
    console.error('Link handler error:', error);
    await ctx.reply('Failed to process link. Please try again.');
  }
}
