import React from 'react';
import { CpuPersonality } from '../types/game';

interface CpuOpponentProps {
  cpu: CpuPersonality;
  isCpuTurn: boolean;
  isGameOver: boolean;
  isWinner: boolean;
  isDraw: boolean;
  currentMessage?: string;
}

export const CpuOpponent: React.FC<CpuOpponentProps> = ({
  cpu,
  isCpuTurn,
  isGameOver,
  isWinner,
  isDraw,
  currentMessage,
}) => {
  const displayMessage = () => {
    if (currentMessage) return currentMessage;
    if (isGameOver) {
      if (isWinner) return cpu.winQuote;
      if (isDraw) return '良き勝負でした！引き分けです。';
      return cpu.loseQuote;
    }
    if (isCpuTurn) return 'ふむ…ここは運を信じるか、確率をとるか…';
    return cpu.quote;
  };

  return (
    <div className="flex items-center gap-3 bg-stone-900/60 border border-stone-800/80 rounded-2xl px-4 py-3 max-w-lg w-full">
      <div className="relative">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-stone-800 border ${
            isCpuTurn ? 'border-amber-400 animate-pulse' : 'border-stone-700'
          }`}
        >
          {cpu.avatar}
        </div>
        {isCpuTurn && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-sm text-stone-200 truncate">{cpu.name}</span>
          <span className="text-[10px] text-stone-400 bg-stone-800/80 px-1.5 py-0.5 rounded">
            {cpu.title}
          </span>
        </div>
        <p className="text-xs text-amber-200/90 italic truncate">
          &ldquo;{displayMessage()}&rdquo;
        </p>
      </div>
    </div>
  );
};
