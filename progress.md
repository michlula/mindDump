# Progress — Mind Dump

## Phase 1: Project Setup + Supabase + Basic Bot — DONE
- [x] Project structure, types, Supabase service, bot commands, Express entry point
- [x] Text message handler, SQL migration, external services setup

## Phase 2: AI Auto-Categorization — DONE
- [x] Gemini Flash text + image categorization
- [x] Inline keyboard for uncertain categorization, callback handler
- [x] Fallback to "General" on AI failure

## Phase 3: Media Handling — DONE
- [x] Photo handler (download, compress with sharp, vision AI, upload)
- [x] Video handler (download, upload, categorize)

## Phase 4: Link Handling — DONE
- [x] URL detection, Open Graph metadata extraction, AI categorize

## Phase 5: Web Dashboard — DONE
- [x] React + Vite + Tailwind, Supabase client, AppShell, CategoryTabs, DumpList, DumpCard
- [x] LinkPreview, MediaViewer, infinite scroll

## Phase 6: Dashboard Polish — DONE (partial)
- [x] Full-text search, pin/delete, dark mode
- [ ] Category management from dashboard — future
- [ ] Filter by content type — future

## Phase 7: Vercel Deployment — DONE
- [x] ESM migration, api/webhook.ts, api/setup.ts, vercel.json
- [x] Deployed and working on free tier

## Phase 8: Batch Processing Pipeline — DONE (code complete)
- [x] Replace immediate processing with save-fast / process-later pipeline
- [x] New pending_messages schema (text/image/video/link with file_id)
- [x] Batch processor service with atomic claim-and-process (batchProcessor.ts)
- [x] Multimodal AI batch function: grouping + titles + categories in one Gemini call
- [x] Thin webhook handlers — just save to pending_messages (<500ms)
- [x] Text handler absorbs link detection (link.ts deleted)
- [x] messageGrouper.ts replaced by batchProcessor.ts
- [x] /api/flush endpoint for pg_cron safety net
- [x] 3s setInterval for local dev batch processing (down from 15s)
- [x] OG scraper timeout reduced to 3s
- [x] Stale window reduced to 3s (down from 10s)
- [x] Debounced per-chat batch trigger (scheduleBatchCheck) — fires 3.5s after last message
- [x] Handlers use non-blocking scheduleBatchCheck instead of sync processStaleBatches
- [x] Integration test script (test-batch.ts) + /test-batch Claude Code skill
- [ ] User: Run updated SQL migration in Supabase SQL Editor (stale window 10s → 3s)
- [ ] User: Add CRON_SECRET to Vercel env vars
- [ ] User: Set up pg_cron in Supabase

## Future
- [ ] Security: Authentication for dashboard, private RLS policies
- [ ] Dashboard: Display AI-generated titles on DumpCard
- [ ] Dashboard: Add `title` column to dumps table for display
