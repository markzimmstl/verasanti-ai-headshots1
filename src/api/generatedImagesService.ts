/**
 * generatedImagesService.ts
 *
 * Persists generated images in the Base44 GeneratedImages entity.
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

// ─── Load ──────────────────────────────────────────────────────────────────

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

    // Async-delete expired records (fire and forget, don't block load)
    const expired = records.filter((r: any) => Number(r.created_at) <= cutoff);
    expired.forEach((r: any) => {
      Entity.delete(r.id).catch(() => {});
    });

    // Reconstruct GeneratedImage objects from stored records
    return fresh.map((r: any): GeneratedImage => ({
      id: r.image_id,
      originalUrl: r.image_url,
      imageUrl: r.image_url,
      styleName: r.style_name || '',
      styleId: r.style_id || '',
      createdAt: Number(r.created_at),
      aspectRatio: r.aspect_ratio || '1:1',
      stylePrompt: r.style_prompt || undefined,
    })).sort((a: GeneratedImage, b: GeneratedImage) => b.createdAt - a.createdAt); // newest first

  } catch (err) {
    console.warn('[Images] Load failed:', err);
    return [];
  }
}

// ─── Save ──────────────────────────────────────────────────────────────────

export async function saveImageForUser(
  userId: string,
  image: GeneratedImage
): Promise<void> {
  const Entity = getEntity();
  if (!Entity) {
    console.warn('[Images] GeneratedImages entity not available — image not persisted');
    return;
  }

  try {
    await Entity.create({
      user_id: userId,
      image_id: image.id,
      image_url: image.imageUrl,
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

// ─── Save batch ────────────────────────────────────────────────────────────

export async function saveImagesForUser(
  userId: string,
  images: GeneratedImage[]
): Promise<void> {
  // Save concurrently but cap at 5 at a time to avoid hammering the API
  const chunks: GeneratedImage[][] = [];
  for (let i = 0; i < images.length; i += 5) {
    chunks.push(images.slice(i, i + 5));
  }
  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(img => saveImageForUser(userId, img)));
  }
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteImageForUser(
  userId: string,
  imageId: string
): Promise<void> {
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