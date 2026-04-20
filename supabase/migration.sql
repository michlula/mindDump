-- Mind Dump Database Schema
-- Run this SQL in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- ============================================================
-- 1. Categories table
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📌',
  color TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default categories
INSERT INTO categories (name, icon, color, sort_order) VALUES
  ('General',     '📝', '#6366f1', 0),
  ('Recipes',     '🍳', '#f59e0b', 1),
  ('Jobs',        '💼', '#10b981', 2),
  ('Deals',       '🏷️', '#ef4444', 3),
  ('Watch Later', '🎬', '#8b5cf6', 4),
  ('Funny',       '😂', '#f97316', 5);

-- ============================================================
-- 2. Dumps table
-- ============================================================
CREATE TABLE dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'link', 'image', 'video')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  media_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  telegram_message_id BIGINT,
  search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dumps_category ON dumps(category_id);
CREATE INDEX idx_dumps_created ON dumps(created_at DESC);
CREATE INDEX idx_dumps_search ON dumps USING GIN(search_vector);

-- ============================================================
-- 3. Pending categorizations (for uncertain AI results)
-- ============================================================
CREATE TABLE pending_categorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT NOT NULL,
  telegram_message_id BIGINT NOT NULL,
  dump_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pending_chat ON pending_categorizations(telegram_chat_id);

-- ============================================================
-- 4. Storage bucket for media
-- ============================================================
-- Run this separately in the Supabase dashboard:
-- Go to Storage → Create new bucket → Name: "media" → Public: ON

-- ============================================================
-- 5. Row Level Security (RLS) — allow public read for dashboard
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dumps ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read categories and dumps (dashboard uses anon key)
CREATE POLICY "Allow public read on categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on dumps" ON dumps
  FOR SELECT USING (true);

-- Allow service role to do everything (server uses service key)
CREATE POLICY "Allow service role full access on categories" ON categories
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on dumps" ON dumps
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on pending_categorizations" ON pending_categorizations
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE pending_categorizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Pending messages (batch processing pipeline)
-- ============================================================
CREATE TABLE pending_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT NOT NULL,
  telegram_message_id BIGINT,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'link')),
  content TEXT,
  telegram_file_id TEXT,
  metadata JSONB DEFAULT '{}',
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pending_messages_chat ON pending_messages(telegram_chat_id);
CREATE INDEX idx_pending_messages_stale ON pending_messages(telegram_chat_id, created_at)
  WHERE claimed_at IS NULL;

ALTER TABLE pending_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on pending_messages" ON pending_messages
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 7. RPC functions for atomic batch processing
-- ============================================================

-- Returns chat IDs where the newest unclaimed message is >3s old
-- or the oldest unclaimed message is >60s old
CREATE OR REPLACE FUNCTION get_stale_batch_chats()
RETURNS TABLE(telegram_chat_id BIGINT) AS $$
  SELECT DISTINCT pm.telegram_chat_id
  FROM pending_messages pm
  WHERE pm.claimed_at IS NULL
  GROUP BY pm.telegram_chat_id
  HAVING
    MAX(pm.created_at) < now() - INTERVAL '3 seconds'
    OR MIN(pm.created_at) < now() - INTERVAL '60 seconds';
$$ LANGUAGE sql SECURITY DEFINER;

-- Atomically claims all unclaimed messages for a chat and returns them
CREATE OR REPLACE FUNCTION claim_pending_batch(p_chat_id BIGINT)
RETURNS SETOF pending_messages AS $$
  WITH claimed AS (
    UPDATE pending_messages
    SET claimed_at = now()
    WHERE telegram_chat_id = p_chat_id
      AND claimed_at IS NULL
    RETURNING *
  )
  SELECT * FROM claimed ORDER BY created_at;
$$ LANGUAGE sql SECURITY DEFINER;
