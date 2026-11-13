import { DiceSkin, GameMode, GameSettings, MatchRecord, TurnStyle } from '../types/game';
import { CPU_ROSTER } from './rules';

const VALID_MODES: readonly GameMode[] = ['vs-cpu', 'pass-and-play', 'solo-challenge'];
const VALID_TURN_STYLES: readonly TurnStyle[] = ['alternating', 'consecutive'];
const VALID_SKINS: readonly DiceSkin[] = ['classic', 'crimson', 'obsidian', 'golden'];
const VALID_CPU_IDS = new Set(CPU_ROSTER.map((c) => c.id));
const VALID_WINNERS = new Set(['p1', 'p2', 'draw']);

const MAX_HISTORY_ITEMS = 50;
const MAX_STRING_LENGTH = 80;

/**
 * Cryptographically secure unbiased die roll (1..6) using Web Crypto API
 * with rejection sampling to eliminate modulo bias.
 */
export function rollSecureDie(): number {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    // Largest multiple of 6 within 2^32 (4294967296) is 4294967292 (6 * 715827882)
    const limit = 4294967292;
    let rand: number;
    do {
      cryptoObj.getRandomValues(buf);
      rand = buf[0];
    } while (rand >= limit);
    return (rand % 6) + 1;
  }

  // Fallback only if Web Crypto is unavailable
  return Math.floor(Math.random() * 6) + 1;
}

function sanitizeText(value: unknown, fallback: string, maxLen = MAX_STRING_LENGTH): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Safely parse and validate persisted GameSettings from localStorage.
 * Prevents prototype pollution and invalid/tampered values.
 */
export function loadValidatedSettings(storageKey: string, defaults: GameSettings): GameSettings {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainRecord(parsed)) return defaults;

    const mode = VALID_MODES.includes(parsed.mode as GameMode)
      ? (parsed.mode as GameMode)
      : defaults.mode;

    const turnStyle = VALID_TURN_STYLES.includes(parsed.turnStyle as TurnStyle)
      ? (parsed.turnStyle as TurnStyle)
      : defaults.turnStyle;

    const diceSkin = VALID_SKINS.includes(parsed.diceSkin as DiceSkin)
      ? (parsed.diceSkin as DiceSkin)
      : defaults.diceSkin;

    const cpuId =
      typeof parsed.cpuId === 'string' && VALID_CPU_IDS.has(parsed.cpuId)
        ? parsed.cpuId
        : defaults.cpuId;

    const soundVolume =
      typeof parsed.soundVolume === 'number' && Number.isFinite(parsed.soundVolume)
        ? Math.max(0, Math.min(1, parsed.soundVolume))
        : defaults.soundVolume;

    return {
      mode,
      turnStyle,
      enableYakuBonus:
        typeof parsed.enableYakuBonus === 'boolean'
          ? parsed.enableYakuBonus
          : defaults.enableYakuBonus,
      enableReroll:
        typeof parsed.enableReroll === 'boolean' ? parsed.enableReroll : defaults.enableReroll,
      diceSkin,
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : defaults.soundEnabled,
      soundVolume,
      cpuId,
    };
  } catch {
    return defaults;
  }
}

function isValidRollsArray(rolls: unknown): rolls is number[] {
  if (!Array.isArray(rolls) || rolls.length > 3) return false;
  return rolls.every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 6);
}

/**
 * Safely parse and validate MatchRecord[] from localStorage.
 */
export function loadValidatedHistory(storageKey: string): MatchRecord[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validated: MatchRecord[] = [];
    for (const item of parsed) {
      if (validated.length >= MAX_HISTORY_ITEMS) break;
      if (!isPlainRecord(item)) continue;

      if (!VALID_MODES.includes(item.mode as GameMode)) continue;
      if (typeof item.winner !== 'string' || !VALID_WINNERS.has(item.winner)) continue;
      if (!isValidRollsArray(item.p1Rolls) || !isValidRollsArray(item.p2Rolls)) continue;
      if (
        typeof item.p1Score !== 'number' ||
        !Number.isFinite(item.p1Score) ||
        item.p1Score < 0 ||
        item.p1Score > 100
      ) {
        continue;
      }
      if (
        typeof item.p2Score !== 'number' ||
        !Number.isFinite(item.p2Score) ||
        item.p2Score < 0 ||
        item.p2Score > 100
      ) {
        continue;
      }

      validated.push({
        id: sanitizeText(item.id, `${Date.now()}-${validated.length}`, 40),
        date: sanitizeText(item.date, '-', 40),
        mode: item.mode as GameMode,
        p1Name: sanitizeText(item.p1Name, 'あなた', 40),
        p1Score: Math.trunc(item.p1Score),
        p1Rolls: [...item.p1Rolls],
        p2Name: sanitizeText(item.p2Name, '相手', 40),
        p2Score: Math.trunc(item.p2Score),
        p2Rolls: [...item.p2Rolls],
        winner: item.winner as 'p1' | 'p2' | 'draw',
        p1Yaku: typeof item.p1Yaku === 'string' ? sanitizeText(item.p1Yaku, '', 60) : undefined,
        p2Yaku: typeof item.p2Yaku === 'string' ? sanitizeText(item.p2Yaku, '', 60) : undefined,
      });
    }

    return validated;
  } catch {
    return [];
  }
}
