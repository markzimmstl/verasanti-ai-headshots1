/**
 * userCreditsService.ts
 *
 * Persists credits in Base44 using the UserCredits entity.
 * Also updates the Base44 user record via auth.updateMe() as a backup.
 */

import { base44 } from './base44Client';

const LS_KEY = 'veralooks_credits';

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
  if (!Entity) return null;

  try {
    const records = await Entity.filter({ user_id: userId });
    if (records && records.length > 0) {
      const val = Number(records[0].credits);
      if (!isNaN(val) && val >= 0) {
        console.log('[Credits] Loaded from Base44 entity:', val);
        return val;
      }
    }
    return null;
  } catch (err) {
    console.warn('[Credits] Entity load failed:', err);
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
    console.warn('[Credits] Entity not available — localStorage only');
    return;
  }

  try {
    const records = await Entity.filter({ user_id: userId });
    if (records && records.length > 0) {
      await Entity.update(records[0].id, { credits });
    } else {
      await Entity.create({ user_id: userId, email, credits });
    }
    console.log('[Credits] Saved to Base44 entity:', credits, 'for', email);
  } catch (err) {
    console.warn('[Credits] Entity save failed — localStorage updated only:', err);
  }

  // Also update the user's own record via updateMe (belt-and-suspenders)
  try {
    await (base44.auth as any).updateMe({ credits_balance: credits });
    console.log('[Credits] Updated user.credits_balance via updateMe');
  } catch {
    // updateMe may not accept custom fields — not a problem
  }
}