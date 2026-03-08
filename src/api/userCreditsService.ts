/**
 * userCreditsService.ts
 *
 * Persists user credits in Base44 using the UserCredits entity.
 * Falls back gracefully to localStorage if Base44 is unavailable.
 */

import { base44 } from './base44Client';

const LS_KEY = 'veralooks_credits';

// Safely access the UserCredits entity — handles any SDK variation
function getEntity() {
  try {
    return (base44 as any).entities?.UserCredits ?? null;
  } catch {
    return null;
  }
}

// ─── Read ──────────────────────────────────────────────────────────────────

export async function loadCreditsForUser(userId: string): Promise<number | null> {
  const Entity = getEntity();
  if (!Entity) {
    console.warn('[Credits] UserCredits entity not available');
    return null;
  }
  try {
    const records = await Entity.filter({ user_id: userId });
    if (records && records.length > 0) {
      const val = Number(records[0].credits);
      if (!isNaN(val)) return val;
    }
    return null;
  } catch (err) {
    console.warn('[Credits] Base44 load failed:', err);
    return null;
  }
}

// ─── Write ─────────────────────────────────────────────────────────────────

export async function saveCreditsForUser(
  userId: string,
  email: string,
  credits: number
): Promise<void> {
  // Always write localStorage immediately (instant, offline-safe)
  localStorage.setItem(LS_KEY, credits.toString());

  const Entity = getEntity();
  if (!Entity) {
    console.warn('[Credits] UserCredits entity not available — localStorage only');
    return;
  }
  try {
    const records = await Entity.filter({ user_id: userId });
    if (records && records.length > 0) {
      await Entity.update(records[0].id, { credits });
    } else {
      await Entity.create({ user_id: userId, email, credits });
    }
    console.log('[Credits] Saved to Base44:', credits, 'for', email);
  } catch (err) {
    console.warn('[Credits] Base44 save failed — localStorage updated only:', err);
  }
}