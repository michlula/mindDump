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
  metadata: LinkMetadata & Record<string, unknown>;
  is_pinned: boolean;
  telegram_message_id: number | null;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
}

export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url?: string;
  event_date?: string | null;
}
