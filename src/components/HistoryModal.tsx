import React from 'react';
import { X, Award, RotateCcw } from 'lucide-react';
import { MatchRecord } from '../types/game';
import { sound } from '../utils/audio';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchRecord[];
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  matches,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const totalMatches = matches.length;
  const wins = matches.filter((m) => m.winner === 'p1').length;
  const losses = matches.filter((m) => m.winner === 'p2').length;
  const draws = matches.filter((m) => m.winner === 'draw').length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const highestScore = matches.reduce((max, m) => {
    return Math.max(max, m.p1Score, m.p2Score);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">戦績 & 対戦履歴</h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-5 bg-stone-950/60 border-b border-stone-800 grid grid-cols-4 gap-2 text-center">
          <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-400 font-semibold">試合数</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{totalMatches}</div>
          </div>
          <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-400 font-semibold">勝率</div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{winRate}%</div>
          </div>
          <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-400 font-semibold">勝 - 負 - 分</div>
            <div className="text-sm font-bold text-stone-300 font-mono mt-1">
              {wins}-{losses}-{draws}
            </div>
          </div>
          <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
            <div className="text-[10px] text-stone-400 font-semibold">最高得点</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{highestScore}</div>
          </div>
        </div>

        {/* Match List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-sm">
              まだ対戦データがありません。<br />サイコロを振って勝負を始めましょう！
            </div>
          ) : (
            matches.map((match) => {
              const isP1Win = match.winner === 'p1';
              const isDraw = match.winner === 'draw';

              return (
                <div
                  key={match.id}
                  className="p-3.5 rounded-xl bg-stone-800/40 border border-stone-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          isP1Win
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isDraw
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isP1Win ? '勝利' : isDraw ? '引分' : '敗北'}
                      </span>
                      <span className="font-bold text-stone-200">
                        {match.p1Name} vs {match.p2Name}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-400 flex items-center gap-2">
                      <span>出目: [{match.p1Rolls.join(', ')}] vs [{match.p2Rolls.join(', ')}]</span>
                      <span>·</span>
                      <span className="text-stone-500">{match.date}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black font-mono">
                      <span className={isP1Win ? 'text-amber-400' : 'text-stone-300'}>
                        {match.p1Score}
                      </span>
                      <span className="text-stone-500 mx-1">-</span>
                      <span className={!isP1Win && !isDraw ? 'text-amber-400' : 'text-stone-300'}>
                        {match.p2Score}
                      </span>
                    </div>
                    {match.p1Yaku && (
                      <div className="text-[10px] text-amber-300/80 truncate max-w-[130px]">
                        {match.p1Yaku}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          {matches.length > 0 ? (
            <button
              onClick={() => {
                if (window.confirm('すべての対戦履歴をリセットしますか？')) {
                  onClearHistory();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>履歴を消去</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="py-2 px-6 rounded-xl font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
