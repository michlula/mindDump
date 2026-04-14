export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Dump {
  id: string;
  content: string;
  type: 'text' | 'link' | 'image' | 'video';
  category_id: string | null;
  media_url: string | null;
  metadata: Record<string, unknown>;
  is_pinned: boolean;
  telegram_message_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface DumpInsert {
  content: string;
  type: 'text' | 'link' | 'image' | 'video';
  category_id?: string;
  media_url?: string;
  metadata?: Record<string, unknown>;
  telegram_message_id?: number;
}

export interface PendingCategorization {
  id: string;
  telegram_chat_id: number;
  telegram_message_id: number;
  dump_payload: DumpInsert;
  created_at: string;
}

export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

export interface PendingMessage {
  id: string;
  telegram_chat_id: number;
  media_type: 'image' | 'video' | 'link';
  media_url: string;
  media_metadata: Record<string, unknown>;
  telegram_message_id: number | null;
  created_at: string;
}

export interface CategorizationResult {
  category: string;
  confidence: number;
}
