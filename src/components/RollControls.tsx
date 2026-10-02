import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';

interface RollControlsProps {
  onRoll: () => void;
  onReroll?: () => void;
  canRoll: boolean;
  canReroll?: boolean;
  isRolling: boolean;
  isCpuTurn: boolean;
  playerName: string;
  roundNumber: number;
}

export const RollControls: React.FC<RollControlsProps> = ({
  onRoll,
  onReroll,
  canRoll,
  canReroll = false,
  isRolling,
  isCpuTurn,
  playerName,
  roundNumber,
}) => {
  const [chargePower, setChargePower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const chargeIntervalRef = useRef<number | null>(null);

  const startCharging = () => {
    if (!canRoll || isRolling || isCpuTurn) return;
    setIsCharging(true);
    setChargePower(10);
    sound.playShake();

    chargeIntervalRef.current = window.setInterval(() => {
      setChargePower((prev) => {
        if (prev >= 100) return 100;
        sound.playShake();
        return prev + 15;
      });
    }, 120);
  };

  const endCharging = () => {
    if (!isCharging) return;
    setIsCharging(false);
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current);
      chargeIntervalRef.current = null;
    }
    setChargePower(0);
    onRoll();
  };

  useEffect(() => {
    return () => {
      if (chargeIntervalRef.current) {
        clearInterval(chargeIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md">
      {/* Power gauge when holding */}
      <div className="w-full h-2 bg-stone-800/80 rounded-full overflow-hidden transition-opacity">
        <div
          className={`h-full transition-all duration-75 ${
            chargePower > 70
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600'
              : 'bg-gradient-to-r from-emerald-500 to-amber-400'
          }`}
          style={{ width: `${chargePower}%` }}
        />
      </div>

      <div className="flex items-center gap-3 w-full">
        {/* Main Roll Button */}
        <button
          type="button"
          disabled={!canRoll || isRolling || isCpuTurn}
          onMouseDown={startCharging}
          onMouseUp={endCharging}
          onTouchStart={startCharging}
          onTouchEnd={endCharging}
          onClick={() => {
            if (!isCharging && canRoll && !isRolling && !isCpuTurn) {
              onRoll();
            }
          }}
          className={`flex-1 relative py-4 px-6 rounded-2xl font-black text-lg tracking-wider transition-all select-none shadow-xl ${
            canRoll && !isRolling && !isCpuTurn
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 hover:brightness-110 active:scale-95 shadow-amber-500/25 border-t border-amber-200 cursor-pointer'
              : 'bg-stone-800 text-stone-500 border border-stone-700/60 cursor-not-allowed opacity-75'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isRolling ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin inline-block">🎲</span>
                ローリング中…
              </span>
            ) : isCpuTurn ? (
              <span className="text-sm font-semibold tracking-normal text-stone-400">
                相手の手番です…
              </span>
            ) : (
              <>
                <span className="text-2xl">🎲</span>
                <span>
                  {playerName}の {roundNumber} 投目を振る！
                </span>
              </>
            )}
          </div>
          {canRoll && !isRolling && !isCpuTurn && (
            <span className="block text-[10px] font-normal tracking-tight text-stone-800/80 mt-0.5">
              タップまたは長押しで気合いチャージ投球
            </span>
          )}
        </button>

        {/* Tactical Reroll Button (if enabled) */}
        {canReroll && (
          <button
            type="button"
            onClick={onReroll}
            disabled={isRolling || isCpuTurn}
            className="py-4 px-4 rounded-2xl font-bold text-sm bg-gradient-to-b from-purple-600 to-indigo-700 text-white hover:brightness-110 active:scale-95 border border-purple-400/50 shadow-lg shadow-purple-600/30 whitespace-nowrap cursor-pointer transition-all"
            title="直前の出目を1回だけ振り直す"
          >
            🔄 振り直す
          </button>
        )}
      </div>
    </div>
  );
};
