import { Context } from 'grammy';
import { containsUrl } from '../../services/linkPreview.js';
import { handleLinkMessage } from './link.js';
import { saveDumpWithCategorization } from './shared.js';

export async function handleTextMessage(ctx: Context) {
  const text = ctx.message?.text;
  if (!text) return;

  // If the message contains a URL, route to link handler
  if (containsUrl(text)) {
    return handleLinkMessage(ctx);
  }

  await saveDumpWithCategorization(ctx, {
    content: text,
    type: 'text',
    telegram_message_id: ctx.message?.message_id,
  });
}
