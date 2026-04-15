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
  telegram_message_id: number | null;
  message_type: 'text' | 'image' | 'video' | 'link';
  content: string | null;
  telegram_file_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BatchMessage extends PendingMessage {
  image_buffer?: Buffer;
  media_url?: string;
}

export interface DumpGroup {
  title: string;
  category: string;
  confidence: number;
  type: 'text' | 'link' | 'image' | 'video';
  message_indices: number[];
}

export interface BatchResult {
  groups: DumpGroup[];
}

export interface CategorizationResult {
  category: string;
  confidence: number;
}
