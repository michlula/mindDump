# Mind Dump

## Goal
Replace the habit of sending messages to yourself on WhatsApp with a dedicated system. Save text, links, screenshots, images, and videos by simply messaging a Telegram bot. AI auto-categorizes everything. A web dashboard provides browsing, searching, and managing saved content.

## Architecture

```
Telegram Bot (input) → Vercel Serverless Function (webhook) → Supabase (DB + Storage)
                            ↓                                       ↑
                     Gemini Flash (AI)                    React Dashboard (Vercel static)
```

- **Input**: Telegram bot — send text, links, images, screenshots, videos
- **Processing**: Vercel serverless function handles Telegram webhooks, AI categorization, media processing
- **AI**: Google Gemini Flash (free tier) auto-categorizes content into folders. Asks user via inline buttons when uncertain
- **Storage**: Supabase (PostgreSQL for data, Storage for media files)
- **Viewing**: React web dashboard (static site on Vercel) for browsing by category, searching, managing items
- **Hosting**: Everything on Vercel free tier ($0/month) — bot as serverless function, dashboard as static site

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Bot Framework | grammY (TypeScript Telegram bot framework) |
| Backend | Node.js + Express (local dev) / Vercel Functions (prod) |
| AI Categorization | Google Gemini 2.0 Flash (free tier) |
| Database | Supabase PostgreSQL |
| File Storage | Supabase Storage |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Data Fetching | TanStack Query |
| Link Previews | open-graph-scraper |
| Image Processing | sharp |

## Key Design Decisions

1. **Telegram as input**: No custom input UI needed — Telegram already supports all media types and feels natural
2. **grammY over node-telegram-bot-api**: First-class TypeScript, built-in webhook middleware for Express
3. **Polling for dev, webhook for prod**: Local dev uses long-polling, Vercel uses webhook via `/api/webhook`
4. **Dashboard reads Supabase directly**: No API proxy needed — uses anon key with read-only RLS
5. **pending_categorizations table**: Stores uncertain AI results in DB (survives server restarts)
6. **sharp for image compression**: Server-side compression keeps storage usage low
7. **Gemini Vision for captionless images**: Multimodal AI understands screenshot content
8. **Vercel for free hosting**: Bot runs as serverless function (webhook), dashboard as static site — $0/month
9. **Single Vercel project**: Both bot and dashboard deploy together from one repo

## Project Structure

```
mindDump/
├── server/           # Telegram bot + Express backend
│   └── src/
│       ├── index.ts              # Express entry point
│       ├── bot/                  # grammY bot setup + handlers
│       │   ├── index.ts          # Bot initialization
│       │   ├── handlers/         # Message type handlers (text, photo, video, link, callback)
│       │   └── commands/         # Bot commands (/start, /categories, /recent)
│       ├── services/             # Business logic
│       │   ├── supabase.ts       # DB operations + Storage uploads
│       │   ├── categorizer.ts    # Gemini Flash AI categorization
│       │   ├── linkPreview.ts    # Open Graph metadata extraction
│       │   └── mediaProcessor.ts # Telegram file download + sharp compression
│       └── types/index.ts        # Shared TypeScript types
│
├── dashboard/        # React web dashboard
│   └── src/
│       ├── components/           # UI components (layout, dump cards, search)
│       ├── hooks/                # Data fetching hooks (useDumps, useCategories, useSearch)
│       ├── lib/supabase.ts       # Supabase client (anon key)
│       └── types/index.ts        # Frontend types
│
├── api/              # Vercel serverless functions (webhook + setup)
├── vercel.json       # Vercel deployment config
├── .env              # Environment variables (not committed)
└── .env.example      # Template for required env vars
```

## Database Tables

- **categories**: id, name, icon (emoji), color (hex), sort_order
- **dumps**: id, content, type (text/link/image/video), category_id, media_url, metadata (JSONB), is_pinned, telegram_message_id, search_vector (tsvector)
- **pending_categorizations**: id, telegram_chat_id, telegram_message_id, dump_payload (JSONB)
