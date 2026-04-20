# CLAUDE.md — Mind Dump Project

## Project Overview
Mind Dump is a personal content-saving system using a Telegram bot for input and a React web dashboard for browsing. AI (Gemini Flash) auto-categorizes content.

## Key Files Reference
- **Plan**: See `project.md` for architecture and tech stack
- **Progress**: See `progress.md` for current checklist
- **Context**: See `context.md` for what's been built and what's pending

## Coding Conventions
- Language: TypeScript (strict mode) for both server and dashboard
- Server runtime: Node.js with Express
- Bot framework: grammY
- Imports: Use named imports, no default exports except React components
- Error handling: Try/catch with console.error logging, graceful fallbacks
- Async: Use async/await throughout

## Project Structure
- `server/` — Node.js backend (Telegram bot + Express)
- `dashboard/` — React frontend (Vite + Tailwind)
- All config files at their respective roots

## Commands
- `cd server && npm run dev` — Start bot server in dev mode (tsx watch)
- `cd dashboard && npm run dev` — Start dashboard dev server (Vite)
- Server uses long-polling in dev (no WEBHOOK_URL needed)

## Environment
- `.env` at `server/.env` — loaded via dotenv with dynamic imports
- Dashboard uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (prefixed for Vite)

## Important Notes
- Server uses Supabase service_role key (full access)
- Dashboard uses Supabase anon key (read-only via RLS)
- Images are compressed server-side with sharp before Supabase upload
- AI categorization has a confidence threshold: >= 0.7 auto-saves, < 0.7 asks user
- pending_categorizations table stores uncertain AI results (survives restarts)
- Update `progress.md` after completing each task
- Update `context.md` when significant changes are made
- Commit and push after every required fix
