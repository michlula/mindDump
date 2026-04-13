import { Context } from 'grammy';
import {
  createDump,
  getPendingCategorization,
  deletePendingCategorization,
  getCategories,
} from '../../services/supabase.js';

export async function handleCallbackQuery(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('cat:')) return;

  const categoryId = data.replace('cat:', '');
  const message = ctx.callbackQuery?.message;

  if (!message) {
    await ctx.answerCallbackQuery({ text: 'Something went wrong.' });
    return;
  }

  try {
    // Find the pending categorization
    const pending = await getPendingCategorization(
      message.chat.id,
      message.message_id
    );

    if (!pending) {
      await ctx.answerCallbackQuery({ text: 'This has already been categorized.' });
      return;
    }

    // Save the dump with the selected category
    const dump = pending.dump_payload;
    dump.category_id = categoryId;

    await createDump(dump);

    // Clean up pending record
    await deletePendingCategorization(pending.id);

    // Find category name for confirmation
    const categories = await getCategories();
    const category = categories.find((c) => c.id === categoryId);
    const catIcon = category?.icon || '📌';
    const catName = category?.name || 'Unknown';

    // Update the message to show confirmation
    await ctx.editMessageText(`Saved to ${catIcon} *${catName}*!`, {
      parse_mode: 'Markdown',
    });

    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error('Callback handler error:', error);
    await ctx.answerCallbackQuery({ text: 'Failed to save. Try again.' });
  }
}
