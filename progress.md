# Progress — Mind Dump

## Phase 1: Project Setup + Supabase + Basic Bot
- [x] Create project directory structure (server/ + dashboard/)
- [x] Server package.json with dependencies
- [x] TypeScript config
- [x] Shared types (Category, Dump, DumpInsert, etc.)
- [x] Supabase service (CRUD operations, storage uploads)
- [x] Bot commands (/start, /categories, /recent)
- [x] Express server entry point (src/index.ts)
- [x] grammY bot initialization (src/bot/index.ts)
- [x] Text message handler
- [x] Install dependencies (npm install)
- [x] SQL migration file for Supabase tables
- [x] User: Create Supabase project + run migration SQL
- [x] User: Create Telegram bot via @BotFather
- [x] User: Get Gemini API key from aistudio.google.com
- [x] User: Fill in .env with credentials (Vercel env vars)
- [x] Test basic text saving flow end-to-end

## Phase 2: AI Auto-Categorization
- [x] Categorizer service (Gemini Flash text + image)
- [x] Integrated categorizer into message handlers
- [x] Inline keyboard for uncertain categorization
- [x] Callback handler for category selection
- [x] Pending categorizations flow
- [x] Fallback to "General" on AI failure
- [x] Test categorization accuracy (working with Gemini 2.5 Flash)

## Phase 3: Media Handling (Images, Screenshots, Videos)
- [x] Media processor service (download, compress, upload)
- [x] Photo message handler
- [x] Video message handler
- [x] Caption extraction and handling
- [x] Gemini Vision for captionless images
- [x] Test with screenshots, photos, videos

## Phase 4: Link Handling + Previews
- [x] Link preview service (URL detection + Open Graph)
- [x] Link message handler (detect URL in text, fetch preview, save)
- [x] Store link metadata in JSONB column
- [x] Test with various URLs

## Phase 5: Web Dashboard — Core
- [x] Initialize React + Vite + Tailwind
- [x] Supabase client (anon key, read-only)
- [x] AppShell layout (mobile-first)
- [x] CategoryTabs (horizontal scroll with counts)
- [x] DumpList (infinite scroll, filtered by category)
- [x] DumpCard (text/link/image/video variants)
- [x] LinkPreview card component
- [x] MediaViewer (full-screen image/video)
- [x] Install dependencies + TypeScript clean (0 errors)

## Phase 6: Dashboard — Search + Polish
- [x] SearchOverlay (full-text search)
- [x] Pin/delete dumps
- [x] Dark mode (follows system preference via Tailwind)
- [ ] Category management (CRUD from dashboard) — future enhancement
- [ ] Pull-to-refresh — future enhancement
- [ ] Filter by content type — future enhancement

## Phase 9: Smart Titles (AI-generated)
- [ ] When a dump has no title or a generic one (e.g. "Photo from Name"), use AI to generate a descriptive title based on the content/image
- [ ] Add `title` field to dumps table (nullable, short text)
- [ ] AI generates title during categorization step (single Gemini call for both category + title)
- [ ] Dashboard displays title prominently on DumpCard
- [ ] Fallback: use first ~60 chars of content if AI title generation fails

## Phase 10: Message Grouping (combine related messages)
- [ ] Track recent messages per chat with timestamps
- [ ] When a photo arrives without a caption, wait briefly (~5s) for a follow-up text message
- [ ] If a text message arrives shortly after a photo/video from the same chat, merge them into one dump (text becomes the caption/title)
- [ ] Use `pending_categorizations` or a new `pending_messages` table to buffer messages
- [ ] Handle edge cases: multiple photos in a row, media groups (Telegram album), text-only sequences

## Phase 8: Security — Private Dashboard Access (future)
- [ ] Remove public read RLS policies from categories and dumps tables
- [ ] Add authentication to dashboard (e.g. Supabase Auth or simple password gate)
- [ ] Restrict dashboard reads to authenticated users only
- [ ] Review storage bucket access (media URLs are public by direct link)

## Phase 7: Free Deployment (Vercel)
- [x] Migrate server from CommonJS to ESM (`"type": "module"`, `.js` import extensions, `nodenext` module resolution)
- [x] Create `api/webhook.ts` — Vercel serverless function using grammY `webhookCallback(bot, "https")`
- [x] Create `api/setup.ts` — one-time GET endpoint to register webhook with Telegram
- [x] Create `vercel.json` — builds dashboard as static site, routes `/api/*` to serverless functions
- [x] Update `.env.example` with Vercel deployment notes
- [x] Deploy to Vercel + verify end-to-end flow

## Ready for Testing

### Local Dev (unchanged)
1. Set up external services (Supabase, Telegram bot, Gemini API)
2. Fill in .env credentials
3. Run `cd server && npm run dev` (long-polling)
4. Run `cd dashboard && npm run dev` (Vite)
5. Message the Telegram bot and verify items appear on dashboard

### Vercel Production (free)
1. Push repo to GitHub
2. Import project in Vercel dashboard
3. Set env vars in Vercel (TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY)
4. Deploy → visit `https://your-app.vercel.app/api/setup` once to register webhook
5. Message the Telegram bot → verify it responds and items appear on dashboard
