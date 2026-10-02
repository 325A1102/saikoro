export type GameMode = 'vs-cpu' | 'pass-and-play' | 'solo-challenge';

export type TurnStyle = 'alternating' | 'consecutive'; // alternating: 1P round 1 -> 2P round 1; consecutive: 1P rolls 3 times, then 2P rolls 3 times

export type DiceSkin = 'classic' | 'crimson' | 'obsidian' | 'golden';

export interface RollResult {
  value: number; // 1 to 6
  rolledAt: number;
  isRerolled?: boolean;
}

export type YakuType = 
  | 'none'
  | 'pinzoro'      // 1-1-1 (Triple 1s) - Legendary
  | 'triple'       // 2-2-2 to 6-6-6 (Any triple)
  | 'straight'     // 1-2-3, 2-3-4, 3-4-5, 4-5-6
  | 'pair'         // 2 matching dice
  | 'high-roller'  // sum >= 15 without triple
  | 'snake-eyes';  // sum <= 5

export interface YakuEvaluation {
  type: YakuType;
  name: string;
  description: string;
  bonusPoints: number;
  multiplier: number;
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  isCpu: boolean;
  rolls: number[]; // up to 3 values
  baseScore: number;
  bonusScore: number;
  totalScore: number;
  yaku?: YakuEvaluation;
  hasUsedReroll: boolean;
}

export interface CpuPersonality {
  id: string;
  name: string;
  title: string;
  avatar: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'master';
  quote: string;
  winQuote: string;
  loseQuote: string;
  taunts: string[];
}

export interface GameSettings {
  mode: GameMode;
  turnStyle: TurnStyle;
  enableYakuBonus: boolean;
  enableReroll: boolean; // Allow 1 reroll per game
  diceSkin: DiceSkin;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  cpuId: string;
}

export interface MatchRecord {
  id: string;
  date: string;
  mode: GameMode;
  p1Name: string;
  p1Score: number;
  p1Rolls: number[];
  p2Name: string;
  p2Score: number;
  p2Rolls: number[];
  winner: 'p1' | 'p2' | 'draw';
  p1Yaku?: string;
  p2Yaku?: string;
}
