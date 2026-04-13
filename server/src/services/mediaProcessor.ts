import sharp from 'sharp';
import { Bot } from 'grammy';
import { uploadMedia } from './supabase.js';

export async function downloadTelegramFile(
  bot: Bot,
  fileId: string
): Promise<Buffer> {
  const file = await bot.api.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function processAndUploadImage(
  bot: Bot,
  fileId: string,
  fileName?: string
): Promise<{ url: string; buffer: Buffer }> {
  const buffer = await downloadTelegramFile(bot, fileId);

  // Compress image: max 1920px on longest side, 80% quality
  const compressed = await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const name = fileName || `image_${Date.now()}.jpg`;
  const url = await uploadMedia(compressed, name, 'image/jpeg');

  return { url, buffer: compressed };
}

export async function processAndUploadVideo(
  bot: Bot,
  fileId: string,
  fileName?: string
): Promise<string> {
  const buffer = await downloadTelegramFile(bot, fileId);

  const name = fileName || `video_${Date.now()}.mp4`;
  const url = await uploadMedia(buffer, name, 'video/mp4');

  return url;
}
