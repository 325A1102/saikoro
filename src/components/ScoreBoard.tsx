import React from 'react';
import { PlayerState, GameSettings } from '../types/game';
import { DiceSkin } from '../types/game';

interface ScoreBoardProps {
  p1: PlayerState;
  p2: PlayerState;
  activePlayerId: string;
  round: number; // 1, 2, 3
  isGameOver: boolean;
  settings: GameSettings;
  diceSkin: DiceSkin;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  p1,
  p2,
  activePlayerId,
  isGameOver,
  settings,
}) => {
  const renderDiceSlots = (rolls: number[], isActive: boolean) => {
    return (
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((idx) => {
          const val = rolls[idx];
          const isFilled = typeof val === 'number';
          const isCurrentSlot = isActive && rolls.length === idx;

          return (
            <div
              key={idx}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-bold text-lg transition-all ${
                isFilled
                  ? 'bg-amber-100/90 text-stone-900 border-2 border-amber-300 shadow-md transform scale-100'
                  : isCurrentSlot
                  ? 'bg-emerald-950/60 border-2 border-emerald-400 text-emerald-300 animate-pulse'
                  : 'bg-stone-900/60 border border-stone-800 text-stone-600'
              }`}
            >
              {isFilled ? (
                <>
                  <span className={val === 1 ? 'text-red-600 font-black' : ''}>{val}</span>
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">
                    R{idx + 1}
                  </span>
                </>
              ) : (
                <span className="text-xs font-mono opacity-40">R{idx + 1}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getWinnerBadge = (player: PlayerState, other: PlayerState) => {
    if (!isGameOver) return null;
    if (player.totalScore > other.totalScore) {
      return (
        <span className="text-xs font-bold text-amber-400 bg-amber-950/70 border border-amber-500/50 px-2 py-0.5 rounded">
          🏆 WINNER
        </span>
      );
    }
    if (player.totalScore === other.totalScore) {
      return (
        <span className="text-xs font-bold text-sky-400 bg-sky-950/70 border border-sky-500/50 px-2 py-0.5 rounded">
          🤝 DRAW
        </span>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Player 1 Card */}
      <div
        className={`relative p-5 rounded-2xl transition-all border ${
          activePlayerId === p1.id && !isGameOver
            ? 'bg-gradient-to-b from-stone-900/90 to-stone-950 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/40'
            : 'bg-stone-900/70 border-stone-800 text-stone-300'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 bg-stone-800/80 rounded-xl">{p1.avatar}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide">{p1.name}</span>
                {getWinnerBadge(p1, p2)}
              </div>
              <p className="text-xs text-stone-400">
                {activePlayerId === p1.id && !isGameOver ? 'あなたの手番' : '待機中'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight font-mono">
              {p1.totalScore}
              <span className="text-xs font-normal text-stone-400 ml-1">pts</span>
            </div>
            {settings.enableYakuBonus && p1.bonusScore > 0 && (
              <span className="text-[11px] font-semibold text-emerald-400">
                +{p1.bonusScore} 役ボーナス
              </span>
            )}
          </div>
        </div>

        {/* Dice Slot Row */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
          <div className="text-xs text-stone-400">出目履歴</div>
          {renderDiceSlots(p1.rolls, activePlayerId === p1.id)}
        </div>

        {/* Yaku Banner if completed */}
        {settings.enableYakuBonus && p1.yaku && p1.rolls.length === 3 && (
          <div className="mt-3 py-1.5 px-3 rounded-lg bg-stone-800/70 border border-stone-700/60 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300">{p1.yaku.name}</span>
            <span className="text-stone-300">{p1.yaku.description}</span>
          </div>
        )}
      </div>

      {/* Player 2 / CPU Card */}
      <div
        className={`relative p-5 rounded-2xl transition-all border ${
          activePlayerId === p2.id && !isGameOver
            ? 'bg-gradient-to-b from-stone-900/90 to-stone-950 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/40'
            : 'bg-stone-900/70 border-stone-800 text-stone-300'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 bg-stone-800/80 rounded-xl">{p2.avatar}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide">{p2.name}</span>
                {getWinnerBadge(p2, p1)}
              </div>
              <p className="text-xs text-stone-400">
                {activePlayerId === p2.id && !isGameOver ? (p2.isCpu ? '思考中…' : '手番中') : '待機中'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight font-mono">
              {p2.totalScore}
              <span className="text-xs font-normal text-stone-400 ml-1">pts</span>
            </div>
            {settings.enableYakuBonus && p2.bonusScore > 0 && (
              <span className="text-[11px] font-semibold text-emerald-400">
                +{p2.bonusScore} 役ボーナス
              </span>
            )}
          </div>
        </div>

        {/* Dice Slot Row */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
          <div className="text-xs text-stone-400">出目履歴</div>
          {renderDiceSlots(p2.rolls, activePlayerId === p2.id)}
        </div>

        {/* Yaku Banner if completed */}
        {settings.enableYakuBonus && p2.yaku && p2.rolls.length === 3 && (
          <div className="mt-3 py-1.5 px-3 rounded-lg bg-stone-800/70 border border-stone-700/60 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300">{p2.yaku.name}</span>
            <span className="text-stone-300">{p2.yaku.description}</span>
          </div>
        )}
      </div>
    </div>
  );
};
