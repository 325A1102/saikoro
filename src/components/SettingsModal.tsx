import React from 'react';
import { X, Settings, Volume2, VolumeX, Sparkles, Users, Cpu } from 'lucide-react';
import { GameSettings, GameMode, TurnStyle, DiceSkin } from '../types/game';
import { CPU_ROSTER } from '../utils/rules';
import { sound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const diceSkins: { id: DiceSkin; name: string; preview: string }[] = [
    { id: 'classic', name: 'クラシック白', preview: 'bg-stone-100 text-red-600' },
    { id: 'crimson', name: 'ルビー紅', preview: 'bg-red-700 text-amber-300' },
    { id: 'obsidian', name: 'オブシディアン黒', preview: 'bg-zinc-900 text-cyan-400' },
    { id: 'golden', name: 'ロイヤルゴールド', preview: 'bg-amber-400 text-red-900' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">ゲーム設定</h2>
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

        {/* Form Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-stone-300">
          {/* Game Mode */}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              対戦モード
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onUpdateSettings({ mode: 'vs-cpu' });
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  settings.mode === 'vs-cpu'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-stone-800/60 border-stone-700/60 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <Cpu className="w-5 h-5" />
                <span>VS CPU</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onUpdateSettings({ mode: 'pass-and-play' });
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  settings.mode === 'pass-and-play'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-stone-800/60 border-stone-700/60 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>2人対戦 (1台)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onUpdateSettings({ mode: 'solo-challenge' });
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  settings.mode === 'solo-challenge'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-stone-800/60 border-stone-700/60 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>ソロハイスコア</span>
              </button>
            </div>
          </div>

          {/* CPU Selection (Only if mode === 'vs-cpu') */}
          {settings.mode === 'vs-cpu' && (
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                対戦相手 (CPU)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CPU_ROSTER.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onUpdateSettings({ cpuId: c.id });
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                      settings.cpuId === c.id
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-stone-800/60 border-stone-700/60 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <span className="text-2xl">{c.avatar}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{c.name}</div>
                      <div className="text-[10px] text-stone-400 truncate">{c.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Turn Style */}
          {settings.mode !== 'solo-challenge' && (
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                投球形式
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onUpdateSettings({ turnStyle: 'alternating' });
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    settings.turnStyle === 'alternating'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-stone-800/60 border-stone-700/60 text-stone-400'
                  }`}
                >
                  <div className="font-bold">1投ずつ交互</div>
                  <div className="text-[10px] opacity-75 mt-0.5">互いに1投ずつ進行（白熱度MAX）</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onUpdateSettings({ turnStyle: 'consecutive' });
                  }}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    settings.turnStyle === 'consecutive'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-stone-800/60 border-stone-700/60 text-stone-400'
                  }`}
                >
                  <div className="font-bold">3投連続</div>
                  <div className="text-[10px] opacity-75 mt-0.5">先攻が3投し、後攻が追う</div>
                </button>
              </div>
            </div>
          )}

          {/* Dice Skin */}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              サイコロの見た目
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {diceSkins.map((sk) => (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onUpdateSettings({ diceSkin: sk.id });
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    settings.diceSkin === sk.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-stone-800/60 border-stone-700/60 text-stone-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${sk.preview} shadow`}>
                    1
                  </div>
                  <span className="text-[11px] font-bold truncate">{sk.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Special Rules */}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              特別ルール
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 cursor-pointer hover:bg-stone-800 transition-colors">
                <div>
                  <div className="font-bold text-stone-200 text-xs">役ボーナス（コンボ）</div>
                  <div className="text-[10px] text-stone-400">ゾロ目やストレートにボーナス点を付与</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableYakuBonus}
                  onChange={(e) => {
                    sound.playClick();
                    onUpdateSettings({ enableYakuBonus: e.target.checked });
                  }}
                  className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 cursor-pointer hover:bg-stone-800 transition-colors">
                <div>
                  <div className="font-bold text-stone-200 text-xs">タクティカル振り直し権</div>
                  <div className="text-[10px] text-stone-400">ゲーム中1回だけ直前の目を振り直せる</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableReroll}
                  onChange={(e) => {
                    sound.playClick();
                    onUpdateSettings({ enableReroll: e.target.checked });
                  }}
                  className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Sound Controls */}
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              サウンド
            </label>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
              <button
                type="button"
                onClick={() => {
                  const next = !settings.soundEnabled;
                  sound.setMuted(!next);
                  onUpdateSettings({ soundEnabled: next });
                  if (next) sound.playClick();
                }}
                className="p-2 rounded-lg bg-stone-700 text-stone-200 hover:text-white"
              >
                {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={!settings.soundEnabled}
                value={settings.soundVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  sound.setVolume(val);
                  onUpdateSettings({ soundVolume: val });
                }}
                className="flex-1 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono text-stone-400 w-10 text-right">
                {Math.round(settings.soundVolume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="py-2.5 px-6 rounded-xl font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            保存して閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
