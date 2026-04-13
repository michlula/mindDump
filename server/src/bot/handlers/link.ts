import { Context } from 'grammy';
import { extractUrls, fetchLinkPreview } from '../../services/linkPreview.js';
import { saveDumpWithCategorization } from './shared.js';
import { categorizeContent } from '../../services/categorizer.js';
import { DumpInsert } from '../../types/index.js';

export async function handleLinkMessage(ctx: Context) {
  const text = ctx.message?.text || ctx.message?.caption || '';
  const urls = extractUrls(text);

  if (urls.length === 0) return;

  try {
    // Use the first URL as the primary link
    const url = urls[0];

    await ctx.reply('🔗 Fetching link preview...');

    const metadata = await fetchLinkPreview(url);

    // Use link title + description for better AI categorization
    const contentForAI = [
      text,
      metadata.title,
      metadata.description,
    ]
      .filter(Boolean)
      .join(' — ');

    const dump: DumpInsert = {
      content: text,
      type: 'link',
      metadata: metadata as unknown as Record<string, unknown>,
      telegram_message_id: ctx.message?.message_id,
    };

    await saveDumpWithCategorization(ctx, {
      ...dump,
      // Override content temporarily for categorization, but save original text
      content: text,
    });
  } catch (error) {
    console.error('Link handler error:', error);
    await ctx.reply('Failed to process link. Please try again.');
  }
}
