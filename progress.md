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

## Phase 8: Batch Processing Pipeline — DONE
- [x] Save-fast / process-later pipeline with pending_messages table
- [x] Batch processor with atomic claim-and-process (batchProcessor.ts)
- [x] Multimodal AI batch: grouping + titles + categories in one Gemini call
- [x] AI retry chain: Gemini 2.5 Flash → 2.0 Flash → OpenRouter (Gemma 3 12B)
- [x] Vercel serverless fix: `waitUntil` for delayed batch processing after webhook response
- [x] Vercel Cron daily safety net (`/api/flush`)
- [x] Webhook re-exports `webhookCallback` (api/ can't import grammy directly)
- [x] Hebrew titles, grouping bias toward single dump, user text preferred for titles
- [x] Integration test script (test-batch.ts) + /test-batch Claude Code skill

## Future
- [ ] Security: Authentication for dashboard, private RLS policies
- [ ] Dashboard: Display AI-generated titles on DumpCard
- [ ] Dashboard: Add `title` column to dumps table for display
