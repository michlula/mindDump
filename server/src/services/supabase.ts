import { createClient } from '@supabase/supabase-js';
import { Category, Dump, DumpInsert, PendingCategorization, PendingMessage } from '../types/index.js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- Categories ---

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data;
}

export async function getCategoryByName(name: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .ilike('name', name)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// --- Dumps ---

export async function createDump(dump: DumpInsert): Promise<Dump> {
  const { data, error } = await supabase
    .from('dumps')
    .insert(dump)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- Pending Categorizations ---

export async function createPendingCategorization(
  chatId: number,
  messageId: number,
  payload: DumpInsert
): Promise<PendingCategorization> {
  const { data, error } = await supabase
    .from('pending_categorizations')
    .insert({
      telegram_chat_id: chatId,
      telegram_message_id: messageId,
      dump_payload: payload,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingCategorization(
  chatId: number,
  messageId: number
): Promise<PendingCategorization | null> {
  const { data, error } = await supabase
    .from('pending_categorizations')
    .select('*')
    .eq('telegram_chat_id', chatId)
    .eq('telegram_message_id', messageId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function deletePendingCategorization(id: string): Promise<void> {
  const { error } = await supabase
    .from('pending_categorizations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// --- Pending Messages (batch processing) ---

export async function insertPendingMessage(msg: {
  telegram_chat_id: number;
  telegram_message_id?: number;
  message_type: 'text' | 'image' | 'video' | 'link';
  content?: string;
  telegram_file_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<PendingMessage> {
  const { data, error } = await supabase
    .from('pending_messages')
    .insert(msg)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getStaleBatchChatIds(): Promise<number[]> {
  const { data, error } = await supabase.rpc('get_stale_batch_chats');
  if (error) throw error;
  return (data || []).map((r: { telegram_chat_id: number }) => r.telegram_chat_id);
}

export async function claimPendingBatch(chatId: number): Promise<PendingMessage[]> {
  const { data, error } = await supabase.rpc('claim_pending_batch', {
    p_chat_id: chatId,
  });
  if (error) throw error;
  return data || [];
}

export async function isPendingMessageExists(
  chatId: number,
  telegramMessageId: number
): Promise<boolean> {
  const { data } = await supabase
    .from('pending_messages')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .eq('telegram_message_id', telegramMessageId)
    .maybeSingle();

  return !!data;
}

export async function isDumpExists(telegramMessageId: number): Promise<boolean> {
  const { data } = await supabase
    .from('dumps')
    .select('id')
    .eq('telegram_message_id', telegramMessageId)
    .maybeSingle();

  return !!data;
}

// --- Media Storage ---

export async function uploadMedia(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const path = `dumps/${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from('media')
    .upload(path, buffer, { contentType });

  if (error) throw error;

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}
