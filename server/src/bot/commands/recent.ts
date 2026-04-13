import { CommandContext, Context } from 'grammy';
import { supabase } from '../../services/supabase.js';

export async function recentCommand(ctx: CommandContext<Context>) {
  try {
    const { data: dumps, error } = await supabase
      .from('dumps')
      .select('*, categories(name, icon)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!dumps || dumps.length === 0) {
      await ctx.reply("You haven't saved anything yet! Just send me a message to get started.");
      return;
    }

    const lines = dumps.map((dump) => {
      const cat = dump.categories as { name: string; icon: string } | null;
      const categoryLabel = cat ? `${cat.icon} ${cat.name}` : '📌 Uncategorized';
      const preview = dump.content.length > 60
        ? dump.content.substring(0, 60) + '...'
        : dump.content;
      const date = new Date(dump.created_at).toLocaleDateString();

      const typeIcons: Record<string, string> = { text: '📝', link: '🔗', image: '📸', video: '🎬' };
      const typeIcon = typeIcons[dump.type] || '📌';

      return `${typeIcon} ${preview}\n   └ ${categoryLabel} · ${date}`;
    });

    await ctx.reply(
      `🕐 *Recent saves:*\n\n${lines.join('\n\n')}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Recent command error:', error);
    await ctx.reply('Failed to load recent items. Please try again.');
  }
}
