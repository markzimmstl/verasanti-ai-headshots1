/**
 * generatedImagesService.ts
 *
 * Persists generated images in Base44 cloud storage.
 * 90-day expiry enforced on load. Falls back gracefully if entity unavailable.
 */

import { base44 } from './base44Client';
import { GeneratedImage } from '../types';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function getEntity() {
  try {
    return (base44 as any).entities?.GeneratedImages ?? null;
  } catch {
    return null;
  }
}

async function uploadBase64Image(base64String: string, fileName: string): Promise<string> {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const byteCharacters = atob(base64Data);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([byteArray], { type: 'image/jpeg' });
  const file = new File([blob], fileName, { type: 'image/jpeg' });

  const { file_url } = await (base44 as any).integrations.Core.UploadFile({ file });
  if (!file_url) throw new Error('Upload returned no file_url');
  return file_url;
}

export async function loadImagesForUser(userId: string): Promise<GeneratedImage[]> {
  const Entity = getEntity();
  if (!Entity) {
    console.warn('[Images] GeneratedImages entity not available');
    return [];
  }
  try {
    const records = await Entity.filter({ user_id: userId });
    if (!records || records.length === 0) return [];

    const cutoff = Date.now() - NINETY_DAYS_MS;
    const fresh = records.filter((r: any) => Number(r.created_at) > cutoff);

    const expired = records.filter((r: any) => Number(r.created_at) <= cutoff);
    expired.forEach((r: any) => Entity.delete(r.id).catch(() => {}));

    return fresh.map((r: any): GeneratedImage => ({
      id: r.image_id,
      originalUrl: r.image_url,
      imageUrl: r.image_url,
      styleName: r.style_name || '',
      styleId: r.style_id || '',
      createdAt: Number(r.created_at),
      aspectRatio: r.aspect_ratio || '1:1',
      stylePrompt: r.style_prompt || undefined,
    })).sort((a: GeneratedImage, b: GeneratedImage) => b.createdAt - a.createdAt);

  } catch (err) {
    console.warn('[Images] Load failed:', err);
    return [];
  }
}

export async function saveImageForUser(userId: string, image: GeneratedImage): Promise<void> {
  const Entity = getEntity();
  if (!Entity) {
    console.warn('[Images] GeneratedImages entity not available');
    return;
  }
  try {
    let imageUrl = image.imageUrl;

    if (imageUrl.startsWith('data:')) {
      console.log('[Images] Uploading base64 to Base44 storage...');
      imageUrl = await uploadBase64Image(imageUrl, `${image.id}.jpg`);
      console.log('[Images] Uploaded:', imageUrl);
    }

    await Entity.create({
      user_id: userId,
      image_id: image.id,
      image_url: imageUrl,
      style_name: image.styleName,
      style_id: image.styleId || '',
      aspect_ratio: image.aspectRatio,
      style_prompt: image.stylePrompt || '',
      created_at: image.createdAt,
    });
    console.log('[Images] Saved image:', image.id, 'for user:', userId);
  } catch (err) {
    console.warn('[Images] Save failed for image', image.id, ':', err);
  }
}

export async function saveImagesForUser(userId: string, images: GeneratedImage[]): Promise<void> {
  const chunks: GeneratedImage[][] = [];
  for (let i = 0; i < images.length; i += 5) {
    chunks.push(images.slice(i, i + 5));
  }
  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(img => saveImageForUser(userId, img)));
  }
}

export async function deleteImageForUser(userId: string, imageId: string): Promise<void> {
  const Entity = getEntity();
  if (!Entity) return;
  try {
    const records = await Entity.filter({ user_id: userId, image_id: imageId });
    if (records && records.length > 0) {
      await Entity.delete(records[0].id);
      console.log('[Images] Deleted image:', imageId);
    }
  } catch (err) {
    console.warn('[Images] Delete failed:', err);
  }
}

function getDownloadsEntity() {
  try {
    return (base44 as any).entities?.ImageDownloads ?? null;
  } catch {
    return null;
  }
}

export async function logDownloadForUser(
  userId: string,
  imageId: string,
  format: 'png' | 'webp' | 'jpg' | 'zip'
): Promise<void> {
  const Entity = getDownloadsEntity();
  if (!Entity) {
    console.warn('[Downloads] ImageDownloads entity not available');
    return;
  }
  try {
    await Entity.create({
      user_id: userId,
      image_id: imageId,
      download_format: format,
      downloaded_at: Date.now(),
    });
    console.log('[Downloads] Logged download:', imageId, format);
  } catch (err) {
    console.warn('[Downloads] Failed to log download:', err);
  }
}