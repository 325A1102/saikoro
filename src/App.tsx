import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings,
  HelpCircle,
  Award,
  Swords,
  Sparkles,
  Flame,
} from 'lucide-react';
import {
  GameMode,
  GameSettings,
  MatchRecord,
  PlayerState,
} from './types/game';
import { CPU_ROSTER, calculatePlayerScore, analyzeTarget } from './utils/rules';
import { sound } from './utils/audio';
import { InteractiveDiceTable } from './components/InteractiveDiceTable';
import { ScoreBoard } from './components/ScoreBoard';
import { RollControls } from './components/RollControls';
import { CpuOpponent } from './components/CpuOpponent';
import { RulesModal } from './components/RulesModal';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';

const DEFAULT_SETTINGS: GameSettings = {
  mode: 'vs-cpu',
  turnStyle: 'alternating',
  enableYakuBonus: true,
  enableReroll: true,
  diceSkin: 'classic',
  soundEnabled: true,
  soundVolume: 0.7,
  cpuId: 'ponkichi',
};

export default function App() {
  // Load settings from localStorage
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('dice_clash_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Load history from localStorage
  const [history, setHistory] = useState<MatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem('dice_clash_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Selected CPU
  const currentCpu = CPU_ROSTER.find((c) => c.id === settings.cpuId) || CPU_ROSTER[0];

  // Players State
  const [p1, setP1] = useState<PlayerState>({
    id: 'p1',
    name: 'あなた',
    avatar: '🤠',
    isCpu: false,
    rolls: [],
    baseScore: 0,
    bonusScore: 0,
    totalScore: 0,
    hasUsedReroll: false,
  });

  const [p2, setP2] = useState<PlayerState>(() => ({
    id: 'p2',
    name: currentCpu.name,
    avatar: currentCpu.avatar,
    isCpu: settings.mode === 'vs-cpu',
    rolls: [],
    baseScore: 0,
    bonusScore: 0,
    totalScore: 0,
    hasUsedReroll: false,
  }));

  // Game Progress
  const [activePlayerId, setActivePlayerId] = useState<'p1' | 'p2'>('p1');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isRerollPending, setIsRerollPending] = useState(false);
  const [currentDiceValue, setCurrentDiceValue] = useState<number>(1);
  const [bannerMessage, setBannerMessage] = useState<string>('サイコロを振って勝負開始！');
  const [cpuMessage, setCpuMessage] = useState<string>('');

  const cpuTurnTimerRef = useRef<number | null>(null);

  // Synchronize audio master settings on mount
  useEffect(() => {
    sound.setMuted(!settings.soundEnabled);
    sound.setVolume(settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('dice_clash_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('dice_clash_history', JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Reset Game
  const resetGame = useCallback(() => {
    if (cpuTurnTimerRef.current) clearTimeout(cpuTurnTimerRef.current);

    setIsRolling(false);
    setIsRerollPending(false);
    setIsGameOver(false);
    setActivePlayerId('p1');
    setCurrentDiceValue(Math.floor(Math.random() * 6) + 1);

    const isVsCpu = settings.mode === 'vs-cpu';
    const cpu = CPU_ROSTER.find((c) => c.id === settings.cpuId) || CPU_ROSTER[0];

    setP1({
      id: 'p1',
      name: settings.mode === 'pass-and-play' ? 'プレイヤー1' : 'あなた',
      avatar: '🤠',
      isCpu: false,
      rolls: [],
      baseScore: 0,
      bonusScore: 0,
      totalScore: 0,
      hasUsedReroll: false,
    });

    setP2({
      id: 'p2',
      name: settings.mode === 'pass-and-play' ? 'プレイヤー2' : settings.mode === 'solo-challenge' ? 'ハイスコア標的' : cpu.name,
      avatar: settings.mode === 'pass-and-play' ? '🦊' : settings.mode === 'solo-challenge' ? '🎯' : cpu.avatar,
      isCpu: isVsCpu,
      rolls: [],
      baseScore: 0,
      bonusScore: 0,
      totalScore: 0,
      hasUsedReroll: false,
    });

    setCpuMessage('');
    if (settings.mode === 'solo-challenge') {
      setBannerMessage('3回振ってどこまで高得点を出せるか挑戦！');
    } else {
      setBannerMessage('第1投目！気合を入れて振ろう！');
    }
  }, [settings.mode, settings.cpuId]);

  // When mode or CPU setting changes, reset match
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Execute Roll Logic
  const handleRoll = useCallback(() => {
    if (isRolling || isGameOver) return;

    const activePlayer = activePlayerId === 'p1' ? p1 : p2;
    if (activePlayer.rolls.length >= 3) return;

    setIsRerollPending(false);
    setIsRolling(true);
  }, [isRolling, isGameOver, activePlayerId, p1, p2]);

  // Process Reroll
  const handleReroll = useCallback(() => {
    const activePlayer = activePlayerId === 'p1' ? p1 : p2;
    if (!settings.enableReroll || activePlayer.hasUsedReroll || activePlayer.rolls.length === 0) return;

    setIsRerollPending(true);
    setIsRolling(true);
  }, [settings.enableReroll, activePlayerId, p1, p2]);

  // Process roll completion and state transition
  const processRollResult = (rolledVal: number, isRerollAction: boolean) => {
    const isP1 = activePlayerId === 'p1';
    const currentPlayer = isP1 ? p1 : p2;

    const newRolls = isRerollAction
      ? [...currentPlayer.rolls.slice(0, -1), rolledVal]
      : [...currentPlayer.rolls, rolledVal];

    const scoreData = calculatePlayerScore(newRolls, settings.enableYakuBonus);

    const updatedPlayer: PlayerState = {
      ...currentPlayer,
      rolls: newRolls,
      baseScore: scoreData.baseScore,
      bonusScore: scoreData.bonusScore,
      totalScore: scoreData.totalScore,
      yaku: scoreData.yaku,
      hasUsedReroll: isRerollAction ? true : currentPlayer.hasUsedReroll,
    };

    if (isP1) {
      setP1(updatedPlayer);
    } else {
      setP2(updatedPlayer);
    }

    // Check if match is finished or next turn
    const isSolo = settings.mode === 'solo-challenge';
    if (isSolo) {
      if (newRolls.length === 3) {
        finishMatch(updatedPlayer, p2);
      } else {
        setBannerMessage(`次は第 ${newRolls.length + 1} 投目！さらに上を目指そう！`);
      }
      return;
    }

    // Two-player / VS CPU Logic
    const otherPlayer = isP1 ? p2 : p1;
    const isTurnComplete = newRolls.length === 3;

    if (settings.turnStyle === 'alternating') {
      // 1P R1 -> 2P R1 -> 1P R2 -> 2P R2 -> 1P R3 -> 2P R3
      const gameFinished = isP1
        ? otherPlayer.rolls.length === 3 && newRolls.length === 3
        : newRolls.length === 3 && otherPlayer.rolls.length === 3;

      if (gameFinished) {
        finishMatch(isP1 ? updatedPlayer : p1, isP1 ? p2 : updatedPlayer);
      } else {
        // Toggle turn
        const nextPlayerId = isP1 ? 'p2' : 'p1';
        setActivePlayerId(nextPlayerId);

        // Update banner tension guidance
        if (nextPlayerId === 'p1') {
          setBannerMessage(`あなたの第 ${p1.rolls.length + (isP1 ? 1 : 2)} 投目！`);
        } else {
          setBannerMessage(`${p2.name} の第 ${p2.rolls.length + 1} 投目！`);
        }
      }
    } else {
      // Consecutive style: 1P rolls all 3, then 2P rolls all 3
      if (isP1) {
        if (isTurnComplete) {
          setActivePlayerId('p2');
          setBannerMessage(`${p2.name} のターン！目標スコアは ${updatedPlayer.totalScore} 点！`);
        } else {
          setBannerMessage(`あなたの第 ${newRolls.length + 1} 投目！`);
        }
      } else {
        if (isTurnComplete) {
          finishMatch(p1, updatedPlayer);
        } else {
          const analysis = analyzeTarget(
            updatedPlayer.totalScore,
            newRolls.length,
            p1.totalScore,
            settings.enableYakuBonus
          );
          setBannerMessage(analysis.message);
        }
      }
    }
  };

  // Finish match, celebrate, record history
  const finishMatch = (finalP1: PlayerState, finalP2: PlayerState) => {
    setIsGameOver(true);

    let winner: 'p1' | 'p2' | 'draw' = 'draw';
    if (finalP1.totalScore > finalP2.totalScore) {
      winner = 'p1';
    } else if (finalP2.totalScore > finalP1.totalScore) {
      winner = 'p2';
    }

    if (winner === 'p1') {
      sound.playVictory();
      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });
      setBannerMessage(`🎉 ${finalP1.name} の勝利！見事な勝負でした！`);
    } else if (winner === 'draw') {
      sound.playPointBeep(5);
      setBannerMessage(`🤝 同点引き分け！奇跡の白熱バトル！`);
    } else {
      sound.playDefeat();
      setBannerMessage(`敗北…！${finalP2.name} の勝利！もう一勝負だ！`);
    }

    // Save match record
    const record: MatchRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      mode: settings.mode,
      p1Name: finalP1.name,
      p1Score: finalP1.totalScore,
      p1Rolls: finalP1.rolls,
      p2Name: finalP2.name,
      p2Score: finalP2.totalScore,
      p2Rolls: finalP2.rolls,
      winner,
      p1Yaku: finalP1.yaku?.name,
      p2Yaku: finalP2.yaku?.name,
    };

    setHistory((prev) => [record, ...prev.slice(0, 49)]);
  };

  // CPU automated turn logic
  useEffect(() => {
    if (
      settings.mode === 'vs-cpu' &&
      activePlayerId === 'p2' &&
      !isGameOver &&
      !isRolling &&
      p2.rolls.length < 3
    ) {
      // Pick dynamic CPU thought/taunt
      const randomTaunt =
        currentCpu.taunts[Math.floor(Math.random() * currentCpu.taunts.length)];
      setCpuMessage(randomTaunt);

      // CPU pauses naturally to simulate human-like or android-like decision
      const delay = Math.floor(Math.random() * 400) + 900;
      cpuTurnTimerRef.current = window.setTimeout(() => {
        handleRoll();
      }, delay);
    }

    return () => {
      if (cpuTurnTimerRef.current) clearTimeout(cpuTurnTimerRef.current);
    };
  }, [activePlayerId, settings.mode, isGameOver, isRolling, p2.rolls.length, handleRoll, currentCpu]);

  // Current active player and target analysis
  const currentActivePlayer = activePlayerId === 'p1' ? p1 : p2;
  const currentRoundNum = Math.min(3, currentActivePlayer.rolls.length + 1);
  const isCpuActive = settings.mode === 'vs-cpu' && activePlayerId === 'p2';

  // Can roll condition
  const canRoll = !isGameOver && !isRolling && !isCpuActive && currentActivePlayer.rolls.length < 3;

  // Can reroll condition
  const canReroll =
    settings.enableReroll &&
    !isGameOver &&
    !isRolling &&
    !isCpuActive &&
    currentActivePlayer.rolls.length > 0 &&
    !currentActivePlayer.hasUsedReroll;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-between font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Navigation Bar */}
      <header className="w-full max-w-5xl px-4 py-4 flex items-center justify-between border-b border-stone-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-stone-950 font-black text-xl shadow-lg shadow-amber-500/20">
            🎲
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              ダイスクラッシュ 3
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                Triple Roll Duel
              </span>
            </h1>
            <p className="text-xs text-stone-400">サイコロを3回振って合計得点を競え！</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !settings.soundEnabled;
              sound.setMuted(!next);
              setSettings((s) => ({ ...s, soundEnabled: next }));
              if (next) sound.playClick();
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            title={settings.soundEnabled ? 'サウンドをミュート' : 'サウンドをON'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Rules Button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsRulesOpen(true);
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="ルール & 役一覧"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">ルール</span>
          </button>

          {/* History / Stats */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsHistoryOpen(true);
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="戦績"
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">戦績</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsSettingsOpen(true);
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
            title="ゲーム設定"
          >
            <Settings className="w-4 h-4 text-stone-300" />
          </button>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="w-full max-w-5xl px-4 py-4 sm:py-6 flex-1 flex flex-col items-center justify-center gap-6">
        {/* Banner / Turn Announcement */}
        <div className="w-full max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-900/90 border border-amber-500/30 text-amber-300 font-bold text-sm sm:text-base shadow-xl">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
        </div>

        {/* CPU Speech / Status (when in VS CPU mode) */}
        {settings.mode === 'vs-cpu' && (
          <CpuOpponent
            cpu={currentCpu}
            isCpuTurn={isCpuActive}
            isGameOver={isGameOver}
            isWinner={p2.totalScore > p1.totalScore}
            isDraw={p1.totalScore === p2.totalScore}
            currentMessage={cpuMessage}
          />
        )}

        {/* Score Board Cards */}
        <ScoreBoard
          p1={p1}
          p2={p2}
          activePlayerId={activePlayerId}
          round={currentRoundNum}
          isGameOver={isGameOver}
          settings={settings}
          diceSkin={settings.diceSkin}
        />

        {/* Interactive Felt Table with Direct 3D Spin & Toss Physics */}
        <InteractiveDiceTable
          value={currentDiceValue}
          isRolling={isRolling}
          canRoll={canRoll}
          skin={settings.diceSkin}
          isCpuTurn={isCpuActive}
          onRollStart={() => {
            setIsRolling(true);
            if (currentActivePlayer.rolls.length === 2) {
              sound.playTension();
            }
          }}
          onRollComplete={(finalVal) => {
            setCurrentDiceValue(finalVal);
            setIsRolling(false);
            const wasReroll = isRerollPending;
            setIsRerollPending(false);
            processRollResult(finalVal, wasReroll);
          }}
        />

        {/* Action Controls / End Match Rematch */}
        {isGameOver ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                resetGame();
              }}
              className="py-3.5 px-8 rounded-2xl font-black text-stone-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:brightness-110 active:scale-95 shadow-xl shadow-amber-500/25 border-t border-amber-100 flex items-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span>もう一度対戦する！</span>
            </button>
          </div>
        ) : (
          <RollControls
            onRoll={handleRoll}
            onReroll={handleReroll}
            canRoll={canRoll}
            canReroll={canReroll}
            isRolling={isRolling}
            isCpuTurn={isCpuActive}
            playerName={currentActivePlayer.name}
            roundNumber={currentRoundNum}
          />
        )}

        {/* Quick Rule Footer Notes */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500">
          <span>モード: {settings.mode === 'vs-cpu' ? 'VS CPU' : settings.mode === 'pass-and-play' ? '2人対戦' : 'ソロ'}</span>
          <span>·</span>
          <span>形式: {settings.turnStyle === 'alternating' ? '1投ずつ交互' : '3投連続'}</span>
          <span>·</span>
          <span>役ボーナス: {settings.enableYakuBonus ? 'ON' : 'OFF'}</span>
          <span>·</span>
          <span>振り直し: {settings.enableReroll ? '1回可能' : 'なし'}</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-stone-600 border-t border-stone-900">
        ダイスクラッシュ 3 (Triple Roll Dice Battle) · 純粋な運と勝負師の直感
      </footer>

      {/* Modals */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
      />
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        matches={history}
        onClearHistory={() => setHistory([])}
      />
    </div>
  );
}
