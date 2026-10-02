import React from 'react';
import { X, Trophy, Sparkles, Flame } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">ルール & 役（コンボ）一覧</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-stone-300">
          <div>
            <h3 className="font-bold text-amber-300 text-base mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 基本ルール
            </h3>
            <p className="leading-relaxed text-stone-300">
              サイコロを<strong className="text-white">各プレイヤーが3回</strong>振り、その合計得点を競い合います。
              3回振ったあとの合計点がより高いプレイヤーが勝利となります。
            </p>
          </div>

          <div>
            <h3 className="font-bold text-amber-300 text-base mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4" /> 役ボーナス（設定でON/OFF可能）
            </h3>
            <p className="text-xs text-stone-400 mb-3">
              役ボーナスが有効の場合、3回の出目によって特別ボーナス点が加算され、大逆転が狙えます！
            </p>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-stone-800/60 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-300">天和・ピンゾロ (1-1-1)</div>
                  <div className="text-xs text-stone-400">1が3回連続で揃う奇跡の役</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-amber-400 font-mono">+15点</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">三連星・ゾロ目 (2-2-2 〜 6-6-6)</div>
                  <div className="text-xs text-stone-400">同じ出目が3つ揃う</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-amber-400 font-mono">+10点</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">昇り龍・ストレート (例: 1-2-3, 4-5-6)</div>
                  <div className="text-xs text-stone-400">出目が連続した3つの数字になる</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-400 font-mono">+5点</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">ハイローラー (出目合計15以上)</div>
                  <div className="text-xs text-stone-400">高得点を叩き出した剛腕</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-400 font-mono">+3点</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">逆転アンダードッグ (出目合計6以下)</div>
                  <div className="text-xs text-stone-400">不運な低迷を救済する逆転ボーナス</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-sky-400 font-mono">+3点</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">ワンペア</div>
                  <div className="text-xs text-stone-400">同じ出目が2つ揃う</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-stone-300 font-mono">+2点</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-amber-300 text-base mb-2">🔄 タクティカル振り直しルール</h3>
            <p className="leading-relaxed text-stone-300 text-xs">
              設定で「振り直し権」をONにすると、ゲーム中1回だけ直前の出目を振り直すことができます。
              1や2が出た時のリカバリーや、ストレート・ゾロ目を狙う勝負所で使いましょう！
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
