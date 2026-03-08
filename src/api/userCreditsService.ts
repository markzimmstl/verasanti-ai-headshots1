/**
 * userCreditsService.ts
 *
 * Persists user credits in Base44 using the UserCredits entity.
 * Falls back to localStorage if Base44 is unavailable.
 *
 * Entity name: UserCredits
 * Fields:
 *   - user_id (string) — Base44 user id
 *   - email (string)   — user email (for lookup)
 *   - credits (number) — current credit balance
 */

import { base44 } from './base44Client';

const UserCredits = (base44 as any).entities.UserCredits;
const LS_KEY = 'veralooks_credits';

// ─── Read ──────────────────────────────────────────────────────────────────

export async function loadCreditsForUser(userId: string): Promise<number | null> {
  try {
    const records = await UserCredits.filter({ user_id: userId });
    if (records && records.length > 0) {
      const val = Number(records[0].credits);
      if (!isNaN(val)) return val;
    }
    return null;
  } catch (err) {
    console.warn('[Credits] Base44 load failed, using localStorage:', err);
    return null;
  }
}

// ─── Write ─────────────────────────────────────────────────────────────────

export async function saveCreditsForUser(
  userId: string,
  email: string,
  credits: number
): Promise<void> {
  // Always update localStorage immediately (fast, offline-safe)
  localStorage.setItem(LS_KEY, credits.toString());

  try {
    const records = await UserCredits.filter({ user_id: userId });
    if (records && records.length > 0) {
      await UserCredits.update(records[0].id, { credits });
    } else {
      await UserCredits.create({ user_id: userId, email, credits });
    }
    console.log('[Credits] Saved to Base44:', credits);
  } catch (err) {
    console.warn('[Credits] Base44 save failed, localStorage updated only:', err);
  }
}