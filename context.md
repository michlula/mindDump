# Context — Mind Dump

## Current State
**APPLICATION IS LIVE AND WORKING.**
**STATUS: Deployed on Vercel. Bot uses batch processing pipeline — messages are saved fast, then processed in batches with AI grouping + titles.**

- Vercel production URL: https://minddumpapp.vercel.app
- Vercel auto-deploys from GitHub on push to main
- All external services set up: Supabase, Telegram bot, Gemini API
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

**Three triggers for batch processing:**
1. Debounced per-chat timer (`scheduleBatchCheck`) — fires 3.5s after the last message (right after the 3s stale window)
2. pg_cron calls `/api/flush` every 1 minute (safety net for single messages with no follow-up)
3. Local dev: `setInterval` every 3s as safety net

**Batch readiness:** A chat's batch is ready when its newest message is >3s old OR its oldest message is >60s old.

## Deployment Strategy: Vercel (Free Tier)
Both the bot and dashboard deploy as a single Vercel project — $0/month.
- **Bot**: Runs as a serverless function via webhook (Telegram pushes updates to `/api/webhook`)
- **Dashboard**: Builds as a static site (Vite → `dashboard/dist/`)
- **Local dev**: Long-polling via `cd server && npm run dev` + batch processor on 3s interval + debounced per-chat trigger

## Database
- 4 tables: `categories`, `dumps`, `pending_categorizations`, `pending_messages`
- `pending_messages` stores raw message data (file_id, content, metadata) — batch processor claims and deletes atomically
- 2 RPC functions: `get_stale_batch_chats()` and `claim_pending_batch(chat_id)` for atomic batch operations
- RLS enabled: public read/update/delete on dumps (anon key), service_role full access on all tables
- Full-text search index on `dumps.search_vector`
- Storage bucket: "media" (public)

## What's Been Created — Complete File Listing

### Server (`server/`) — all dependencies installed
```
server/
├── package.json              # deps: grammy, express, @google/generative-ai, @supabase/supabase-js, sharp, open-graph-scraper, dotenv
├── tsconfig.json
└── src/
    ├── index.ts              # Express entry point, webhook/polling mode, env validation, 3s batch interval (dev)
    ├── types/
    │   └── index.ts          # Category, Dump, DumpInsert, PendingMessage, BatchMessage, DumpGroup, BatchResult, etc.
    ├── bot/
    │   ├── index.ts          # createBot() — registers all handlers + commands
    │   ├── commands/
    │   │   ├── start.ts      # /start and /help
    │   │   ├── categories.ts # /categories
    │   │   └── recent.ts     # /recent
    │   └── handlers/
    │       ├── text.ts       # Save text/link to pending_messages (absorbs URL detection)
    │       ├── photo.ts      # Save file_id + metadata to pending_messages
    │       ├── video.ts      # Save file_id + metadata to pending_messages
    │       ├── callback.ts   # Inline keyboard callbacks — user picks category
    │       └── shared.ts     # askForCategory(), askForCategoryViaBot(), CONFIDENCE_THRESHOLD, TYPE_ICONS
    └── services/
        ├── supabase.ts       # Supabase client + CRUD: categories, dumps, pending_categorizations, insertPendingMessage, getStaleBatchChatIds, claimPendingBatch
        ├── categorizer.ts    # categorizeContent(), categorizeImage(), processBatch() (multimodal AI grouping + titles)
        ├── batchProcessor.ts # processStaleBatches() + scheduleBatchCheck() — debounced per-chat trigger, claims batches, downloads media, calls AI, creates dumps
        ├── test-batch.ts     # Integration test script — inserts test messages, verifies batch processing
        ├── linkPreview.ts    # extractUrls(), containsUrl(), fetchLinkPreview() (3s timeout)
        └── mediaProcessor.ts # downloadTelegramFile(), processAndUploadImage(), processAndUploadVideo()
```

### Dashboard (`dashboard/`) — all dependencies installed
```
dashboard/
├── package.json              # deps: react, react-dom, @tanstack/react-query, @supabase/supabase-js, tailwindcss
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx, App.tsx, index.css, vite-env.d.ts
    ├── types/index.ts
    ├── lib/supabase.ts
    ├── hooks/
    │   ├── useCategories.ts, useDumps.ts, useSearch.ts
    └── components/
        ├── layout/   AppShell.tsx, Header.tsx, CategoryTabs.tsx
        ├── dump/     DumpCard.tsx, DumpList.tsx, LinkPreview.tsx, MediaViewer.tsx
        └── search/   SearchOverlay.tsx
```

### Vercel Serverless Functions (`api/`)
```
api/
├── webhook.ts    # Telegram webhook handler
├── setup.ts      # One-time webhook registration
└── flush.ts      # pg_cron endpoint — triggers processStaleBatches(), protected by CRON_SECRET header
```

### Root Files
```
mindDump/
├── package.json, vercel.json, .gitignore, .env.example
├── project.md, progress.md, context.md, CLAUDE.md
└── supabase/migration.sql
```

## Environment Variables
- **Vercel**: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY, CRON_SECRET
- **Dashboard**: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (in `dashboard/.env`)

## Pending Setup (User)
- [ ] Run SQL migration in Supabase SQL Editor (new pending_messages table + RPC functions)
- [ ] Add CRON_SECRET env var to Vercel
- [ ] Visit /api/setup to re-register webhook after deploy
- [ ] Set up pg_cron in Supabase to call /api/flush every minute
