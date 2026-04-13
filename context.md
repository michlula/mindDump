# Context — Mind Dump

## Current State
**ALL CODE IS WRITTEN AND TYPESCRIPT-CLEAN (0 errors on both server and dashboard).**
**STATUS: Vercel deployment code complete (ESM migration done, serverless functions created). Ready for external service setup + deploy.**

Nothing has been tested yet. No .env files exist. No external services have been created.

## Deployment Strategy: Vercel (Free Tier)
Both the bot and dashboard deploy as a single Vercel project — $0/month.
- **Bot**: Runs as a serverless function via webhook (Telegram pushes updates to `/api/webhook`)
- **Dashboard**: Builds as a static site (Vite → `dashboard/dist/`)
- **Local dev**: Unchanged — long-polling via `cd server && npm run dev`

### Completed code changes for Vercel:
1. **ESM migration**: Server uses ESM (`"type": "module"`, `.js` extensions on all relative imports, `"module": "nodenext"` in tsconfig)
2. **`api/webhook.ts`**: Vercel serverless function — imports `createBot()`, exports `webhookCallback(bot, "https")`
3. **`api/setup.ts`**: One-time endpoint to register the webhook URL with Telegram
4. **`vercel.json`**: Build config — dashboard static output + serverless function routing

### Cost breakdown (all free):
| Component | Host | Cost |
|-----------|------|------|
| Bot (webhook) | Vercel Functions | $0 |
| Dashboard | Vercel (static) | $0 |
| Database | Supabase free tier | $0 |
| Storage | Supabase (1 GB free) | $0 |
| AI | Gemini Flash free tier | $0 |
| Telegram | Always free | $0 |

### Known limitation:
Vercel free tier has a 10-second function timeout. Image processing (sharp compression + Gemini Vision) could be tight for very large images. Acceptable for personal use.

## Next Steps (In Order)

### Code changes — DONE
1. ~~Migrate server to ESM (module type, import extensions, tsconfig)~~
2. ~~Create `api/webhook.ts` and `api/setup.ts` serverless functions~~
3. ~~Create `vercel.json` config~~
4. ~~Verify TypeScript still compiles clean~~

### External setup (User does this):
5. Create Supabase project at supabase.com (free tier)
6. Run `supabase/migration.sql` in Supabase SQL Editor
7. Create a Storage bucket named "media" (set to Public) in Supabase dashboard
8. Create Telegram bot via @BotFather → save bot token
9. Get Gemini API key at aistudio.google.com (free tier)
10. Push repo to GitHub
11. Import project in Vercel → set env vars (TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY, GEMINI_API_KEY)
12. Deploy → visit `https://your-app.vercel.app/api/setup` once
13. Message the bot → verify items appear on dashboard

### For local dev (optional):
- Create `.env` at project root with all credentials (see `.env.example`)
- Create `dashboard/.env` with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
- Run `cd server && npm run dev` (long-polling) + `cd dashboard && npm run dev` (Vite)

## What's Been Created — Complete File Listing

### Server (`server/`) — 14 source files, all dependencies installed
```
server/
├── package.json              # deps: grammy, express, @google/generative-ai, @supabase/supabase-js, sharp, open-graph-scraper, dotenv
├── package-lock.json
├── tsconfig.json
├── node_modules/
└── src/
    ├── index.ts              # Express entry point, webhook/polling mode, env validation
    ├── types/
    │   └── index.ts          # Category, Dump, DumpInsert, PendingCategorization, LinkMetadata, CategorizationResult
    ├── bot/
    │   ├── index.ts          # createBot() — grammY setup, registers all handlers + commands
    │   ├── commands/
    │   │   ├── start.ts      # /start and /help — welcome message with usage instructions
    │   │   ├── categories.ts # /categories — lists categories with item counts
    │   │   └── recent.ts     # /recent — shows last 5 dumps
    │   └── handlers/
    │       ├── text.ts       # Text messages — routes to link handler if URL detected
    │       ├── photo.ts      # Photos/screenshots — download, compress (sharp), vision AI categorize, upload
    │       ├── video.ts      # Videos — download, upload, categorize (warns if >50MB)
    │       ├── link.ts       # Links — OG metadata extraction, AI categorize
    │       ├── callback.ts   # Inline keyboard callbacks — user picks category for uncertain AI
    │       └── shared.ts     # saveDumpWithCategorization() + askForCategory() — shared logic
    └── services/
        ├── supabase.ts       # Supabase client + CRUD: getCategories, getCategoryByName, createDump, uploadMedia, pending categorization CRUD
        ├── categorizer.ts    # categorizeContent(text) + categorizeImage(buffer) — Gemini 2.0 Flash
        ├── linkPreview.ts    # extractUrls(), containsUrl(), fetchLinkPreview() — open-graph-scraper
        └── mediaProcessor.ts # downloadTelegramFile(), processAndUploadImage() (sharp compress), processAndUploadVideo()
```

### Dashboard (`dashboard/`) — 13 source files, all dependencies installed
```
dashboard/
├── package.json              # deps: react, react-dom, @tanstack/react-query, @supabase/supabase-js, tailwindcss, @tailwindcss/vite, vite, @vitejs/plugin-react
├── package-lock.json
├── tsconfig.json
├── vite.config.ts            # Vite + React + Tailwind v4 plugin
├── index.html                # Mobile viewport, dark mode body class
├── .env.example              # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── node_modules/
└── src/
    ├── main.tsx              # React root mount
    ├── App.tsx               # QueryClientProvider + AppShell
    ├── index.css             # Tailwind import + scrollbar-hide utility
    ├── vite-env.d.ts         # Vite type declarations
    ├── types/
    │   └── index.ts          # Category, Dump, LinkMetadata
    ├── lib/
    │   └── supabase.ts       # Supabase client with VITE_ prefixed env vars
    ├── hooks/
    │   ├── useCategories.ts  # useCategories() + useCategoryCounts()
    │   ├── useDumps.ts       # useDumps(categoryId) infinite scroll + useDeleteDump + useTogglePin + useUpdateDumpCategory
    │   └── useSearch.ts      # useSearch(query) — tsquery full-text search
    └── components/
        ├── layout/
        │   ├── AppShell.tsx      # Main layout: Header + CategoryTabs + DumpList/SearchOverlay
        │   ├── Header.tsx        # Top bar: "Mind Dump" title + search toggle button
        │   └── CategoryTabs.tsx  # Horizontal scrollable tabs with "All" + per-category + counts
        ├── dump/
        │   ├── DumpCard.tsx      # Card component: text/link/image/video variants, pin badge, context menu (pin/delete), footer with category + timestamp
        │   ├── DumpList.tsx      # Infinite scroll list with IntersectionObserver, loading spinner, empty state
        │   ├── LinkPreview.tsx   # URL preview card: OG image + title + description + site name
        │   └── MediaViewer.tsx   # Full-screen overlay for images/videos, ESC to close
        └── search/
            └── SearchOverlay.tsx # Search input + results list + empty/no-results states
```

### Vercel Serverless Functions (`api/`)
```
api/
├── webhook.ts                # Telegram webhook handler — imports createBot(), exports webhookCallback(bot, "https")
└── setup.ts                  # One-time GET endpoint to register webhook URL with Telegram
```

### Root Files
```
mindDump/
├── package.json              # Root deps for Vercel serverless functions (grammy, sharp, etc.)
├── .env.example              # TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY, GEMINI_API_KEY
├── .gitignore                # node_modules/, dist/, .env, *.log, .DS_Store
├── vercel.json               # Vercel config: dashboard static build + serverless function routing
├── project.md                # Architecture overview, tech stack, design decisions
├── progress.md               # Phase-by-phase checklist
├── context.md                # THIS FILE — current state reference
├── CLAUDE.md                 # Coding conventions, commands, key notes
└── supabase/
    └── migration.sql         # Complete schema: categories + dumps + pending_categorizations + indexes + RLS policies + seed data
```

## Key Architecture Details

### How the bot works
1. User sends message to Telegram bot
2. `server/src/index.ts` receives it (via long-polling in dev, webhook in prod)
3. grammY routes to correct handler based on message type (text/photo/video)
4. Handler processes content (download media, extract URLs, fetch OG metadata)
5. `categorizer.ts` calls Gemini Flash to classify into a category
6. If confidence >= 0.7 → auto-save to Supabase + confirm to user
7. If confidence < 0.7 → send inline keyboard → user picks → callback handler saves

### How the dashboard works
- React app reads directly from Supabase using anon key (no backend proxy)
- TanStack Query handles caching, pagination, background refresh
- Infinite scroll via IntersectionObserver
- Full-text search via PostgreSQL tsvector

### Environment variable flow
- **Server** loads from `mindDump/.env` via dotenv (path: `../../.env` relative to `src/`)
- **Dashboard** reads from `dashboard/.env` with `VITE_` prefix (Vite convention)

### Database
- 3 tables: `categories`, `dumps`, `pending_categorizations`
- RLS enabled: public read (anon key), full access (service_role key)
- Full-text search index on `dumps.search_vector` (generated tsvector column)
- Storage bucket: "media" (must be created manually as Public)
