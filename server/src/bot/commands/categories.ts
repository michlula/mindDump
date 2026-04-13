import { CommandContext, Context } from 'grammy';
import { getCategories } from '../../services/supabase.js';
import { supabase } from '../../services/supabase.js';

export async function categoriesCommand(ctx: CommandContext<Context>) {
  try {
    const categories = await getCategories();

    // Get count of dumps per category
    const lines = await Promise.all(
      categories.map(async (cat) => {
        const { count } = await supabase
          .from('dumps')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id);

        return `${cat.icon} *${cat.name}* — ${count || 0} items`;
      })
    );

    await ctx.reply(
      `📂 *Your Categories:*\n\n${lines.join('\n')}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Categories command error:', error);
    await ctx.reply('Failed to load categories. Please try again.');
  }
}
