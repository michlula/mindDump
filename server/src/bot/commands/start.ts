import { CommandContext, Context } from 'grammy';

export async function startCommand(ctx: CommandContext<Context>) {
  await ctx.reply(
    `Welcome to Mind Dump! 🧠

Just send me anything you want to save:

📝 *Text* - Type any note or thought
🔗 *Links* - Paste a URL and I'll grab a preview
📸 *Photos/Screenshots* - Send images directly
🎬 *Videos* - Forward or send videos

I'll automatically categorize everything using AI. If I'm not sure, I'll ask you to pick a category.

Browse your saved items on the web dashboard.

*Commands:*
/categories - View all categories
/recent - See your last 5 saves
/help - Show this message`,
    { parse_mode: 'Markdown' }
  );
}
