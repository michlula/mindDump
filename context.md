# Context — Mind Dump

## Current State
**APPLICATION IS LIVE AND WORKING.**
**STATUS: Deployed on Vercel. Bot uses batch processing pipeline with Vercel `waitUntil` for serverless-compatible delayed processing.**

- Vercel production URL: https://minddumpapp.vercel.app
- Vercel auto-deploys from GitHub on push to main
- All external services set up: Supabase, Telegram bot, Gemini API, OpenRouter (fallback)
- Telegram webhook registered to: https://minddumpapp.vercel.app/api/webhook
- RLS policies allow public read + update + delete on dumps (no auth yet)

## Architecture: Batch Processing Pipeline

```
User sends messages → Webhook saves to pending_messages (<500ms)
                      ↓
              3s of inactivity (or 60s max wait)
                      ↓
         Batch processor triggers
                      ↓
         Download media → Compress → Upload to Supabase Storage
                      ↓
         Gemini AI: grouping + titles + categories (single multimodal call)
                      ↓
         Create dump(s) → Notify user via Telegram
```

**Batch processing triggers (Vercel serverless):**
1. `waitUntil` in webhook handler — keeps function alive 5s after each message, then calls `processStaleBatches()` (primary trigger on Vercel)
2. Immediate `processStaleBatches()` after each webhook — catches already-stale batches from earlier messages
3. Vercel Cron calls `/api/flush` once daily at midnight UTC (last-resort safety net; Hobby tier limit)
4. Local dev: `setInterval` every 3s + debounced `scheduleBatchCheck` per chat

**Batch readiness:** A chat's batch is ready when its newest message is >3s old OR its oldest message is >60s old.

## AI Prompt Behavior
- Titles generated in **Hebrew**
- Messages sent in quick succession biased toward **single group** (only split if clearly unrelated)
- When a group has multiple messages (image+text, link+text, etc.), user's text is preferred for title if it relates to the other content
- AI retry chain: Gemini 2.5 Flash → Gemini 2.0 Flash → OpenRouter (Gemma 3 12B)

## Deployment Strategy: Vercel (Free Tier)
Both the bot and dashboard deploy as a single Vercel project — $0/month.
- **Bot**: Serverless function via webhook (`/api/webhook`) with `@vercel/functions` `waitUntil` for background batch processing
- **Dashboard**: Static site (Vite → `dashboard/dist/`)
- **Local dev**: Long-polling via `cd server && npm run dev`

## Database
- 4 tables: `categories`, `dumps`, `pending_categorizations`, `pending_messages`
- `pending_messages` stores raw message data (file_id, content, metadata) — batch processor claims and deletes atomically
- 2 RPC functions: `get_stale_batch_chats()` and `claim_pending_batch(chat_id)` for atomic batch operations
- RLS enabled: public read/update/delete on dumps (anon key), service_role full access on all tables
- Full-text search index on `dumps.search_vector`
- Storage bucket: "media" (public)

## Dashboard Features
- Category tabs with counts (sticky below header)
- Content type filter chips with counts: All / Text / Links / Images / Videos (sticky below category tabs)
- Both filters combine (intersection): e.g. "Recipes" + "image" = only image dumps in Recipes
- Full-text search overlay, pin/delete, dark mode, infinite scroll

## Key Files

### Vercel Serverless Functions (`api/`)
- `api/webhook.ts` — Telegram webhook handler + `waitUntil` batch processing + `@vercel/functions`
- `api/setup.ts` — One-time webhook registration
- `api/flush.ts` — Cron/manual endpoint for `processStaleBatches()`, protected by optional CRON_SECRET

### Server (`server/src/`)
- `bot/index.ts` — `createBot()`, re-exports `webhookCallback` from grammy (api/ layer can't import grammy directly)
- `services/batchProcessor.ts` — `processStaleBatches()`, `scheduleBatchCheck()`, `processChatBatch()`
- `services/categorizer.ts` — AI prompts (Gemini + OpenRouter), batch grouping/titling/categorization

### Root
- `vercel.json` — build config + daily cron (`0 0 * * *`)
- `package.json` — root deps: `@vercel/node`, `@vercel/functions`

## Environment Variables
- **Vercel**: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, CRON_SECRET (optional)
- **Dashboard**: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (in `dashboard/.env`)

## Pending Setup (User)
- [ ] Add CRON_SECRET env var to Vercel (optional — flush works without it)
