import { CpuPersonality, YakuEvaluation } from '../types/game';

export const CPU_ROSTER: CpuPersonality[] = [
  {
    id: 'ponkichi',
    name: 'ぽん吉',
    title: '見習いダイサー',
    avatar: '🦝',
    difficulty: 'easy',
    quote: 'サイコロころころ〜！がんばるポン！',
    winQuote: 'わーい！ぽん吉の勝ちだポン！',
    loseQuote: 'むぎゅ…負けちゃったポン。つよいポン…',
    taunts: [
      'おおきな目、でてほしいポン！',
      'えいやー！っと転がすポン！',
      'サイコロってドキドキするポン！',
    ],
  },
  {
    id: 'zero',
    name: '零 (Zero)',
    title: '確率計算アンドロイド',
    avatar: '🤖',
    difficulty: 'normal',
    quote: 'ダイスの理論期待値は1回あたり3.5。計算完了。',
    winQuote: '確率論の勝利です。想定通りの帰結。',
    loseQuote: '計算外の分散を観測…お見事です。',
    taunts: [
      '3回合計の理論中央値は10.5です。',
      'ダイスの重心偏向、許容誤差範囲内。',
      '乱数の神に祈る必要はありません、統計です。',
    ],
  },
  {
    id: 'rouge',
    name: 'マダム・ルージュ',
    title: '裏カジノの豪運女王',
    avatar: '💃',
    difficulty: 'hard',
    quote: 'サイコロはね、愛した者の手に従うのよ。',
    winQuote: 'ふふっ、運命の女神はいつでも私の味方よ。',
    loseQuote: 'あら…やるじゃない。その運、気に入ったわ。',
    taunts: [
      'ここで6を出せるのが、本物の勝負師よ。',
      '震えているの？サイコロに迷いが伝わるわよ。',
      'もっと熱くさせてちょうだい！',
    ],
  },
  {
    id: 'zeus',
    name: 'ゼウス',
    title: '全知全能のダイス神',
    avatar: '⚡',
    difficulty: 'master',
    quote: '我こそがサイコロの軌道を司る天帝なり！',
    winQuote: 'ハーッハッハ！神の出目に敵うものなし！',
    loseQuote: 'ぬうっ…人間よ、その豪運、神話に刻もうぞ！',
    taunts: [
      '雷光の如き出目を見よ！',
      '運命の車輪を回すのは我が意志ぞ！',
      '天を衝くゾロ目を刻んでくれよう！',
    ],
  },
];

/**
 * Evaluates special combo hands (役) from 3 rolls
 */
export function evaluateYaku(rolls: number[]): YakuEvaluation {
  if (rolls.length < 3) {
    return {
      type: 'none',
      name: '未確定',
      description: '3投で役が判定されます',
      bonusPoints: 0,
      multiplier: 1,
    };
  }

  const [a, b, c] = rolls;
  const sorted = [...rolls].sort((x, y) => x - y);

  // 1-1-1 Pinzoro (Legendary)
  if (a === 1 && b === 1 && c === 1) {
    return {
      type: 'pinzoro',
      name: '天和・ピンゾロ (1-1-1)',
      description: '伝説の三連1！神がかりのボーナス +15点！',
      bonusPoints: 15,
      multiplier: 2,
    };
  }

  // Triples (2-2-2 through 6-6-6)
  if (a === b && b === c) {
    return {
      type: 'triple',
      name: `三連星・ゾロ目 (${a}-${b}-${c})`,
      description: '同数3連続の奇跡！ボーナス +10点！',
      bonusPoints: 10,
      multiplier: 1,
    };
  }

  // Straight (e.g. 1-2-3, 2-3-4, 3-4-5, 4-5-6)
  const isStraight =
    sorted[0] + 1 === sorted[1] && sorted[1] + 1 === sorted[2];
  if (isStraight) {
    return {
      type: 'straight',
      name: `昇り龍・ストレート (${sorted.join('-')})`,
      description: '連番の美技！ボーナス +5点！',
      bonusPoints: 5,
      multiplier: 1,
    };
  }

  // One Pair
  if (a === b || b === c || a === c) {
    const pairNum = a === b ? a : b === c ? b : a;
    return {
      type: 'pair',
      name: `ワンペア (${pairNum}が2個)`,
      description: '堅実なペア！ボーナス +2点！',
      bonusPoints: 2,
      multiplier: 1,
    };
  }

  // High Roller (Base sum >= 15 without triple, e.g. 5-5-6, 4-6-6, 5-6-6)
  const sum = a + b + c;
  if (sum >= 15) {
    return {
      type: 'high-roller',
      name: 'ハイローラー',
      description: '合計15以上の剛腕！ボーナス +3点！',
      bonusPoints: 3,
      multiplier: 1,
    };
  }

  // Snake Eyes / Underdog reversal (Sum <= 5, e.g. 1-1-2, 1-2-2)
  if (sum <= 6) {
    return {
      type: 'snake-eyes',
      name: '逆転の狼煙 (アンダードッグ)',
      description: '出目合計6以下の低迷を救うボーナス +3点！',
      bonusPoints: 3,
      multiplier: 1,
    };
  }

  return {
    type: 'none',
    name: 'ノーボーナス',
    description: '基本合計得点のみ',
    bonusPoints: 0,
    multiplier: 1,
  };
}

/**
 * Calculates current score details for a player
 */
export function calculatePlayerScore(rolls: number[], enableYakuBonus: boolean) {
  const baseScore = rolls.reduce((acc, curr) => acc + curr, 0);
  const yaku = enableYakuBonus ? evaluateYaku(rolls) : evaluateYaku([]);
  const bonusScore = enableYakuBonus && rolls.length === 3 ? yaku.bonusPoints : 0;
  return {
    baseScore,
    bonusScore,
    totalScore: baseScore + bonusScore,
    yaku: rolls.length === 3 ? yaku : undefined,
  };
}

/**
 * Calculates target analysis for player: what score is needed to win or draw
 */
export function analyzeTarget(
  currentScore: number,
  rollsCount: number,
  opponentFinalScore: number,
  enableYakuBonus: boolean
): { message: string; tension: 'low' | 'medium' | 'high' | 'critical' } {
  const rollsLeft = 3 - rollsCount;
  if (rollsLeft <= 0) {
    if (currentScore > opponentFinalScore) {
      return { message: '勝利確定！見事な出目でした！', tension: 'low' };
    } else if (currentScore === opponentFinalScore) {
      return { message: '同点ドロー！大接戦でした！', tension: 'medium' };
    } else {
      return { message: '一歩届かず！悔しい結果に！', tension: 'low' };
    }
  }

  const diff = opponentFinalScore - currentScore;
  const neededToWin = diff + 1;
  const neededToDraw = diff;

  if (rollsLeft === 1) {
    if (neededToWin > 6 && !enableYakuBonus) {
      if (neededToDraw === 6) {
        return { message: 'ドローには最高目【 6 】が必須！', tension: 'critical' };
      }
      return { message: '勝利には届かないが最後までベストを！', tension: 'medium' };
    }
    if (neededToWin <= 1) {
      return { message: 'どの目でも勝利確定のウイニングロール！', tension: 'low' };
    }
    if (neededToWin <= 6) {
      return {
        message: `勝利には【 ${neededToWin} 以上 】の出目が必要！`,
        tension: neededToWin >= 5 ? 'critical' : 'high',
      };
    }
  }

  if (rollsLeft === 2) {
    const minPossible = 2;
    const maxPossible = 12;
    if (neededToWin > maxPossible && !enableYakuBonus) {
      return { message: '厳しい展開！ミラクル逆転を狙おう！', tension: 'high' };
    }
    return {
      message: `勝利まであと合計 ${Math.max(1, neededToWin)} 点必要！`,
      tension: neededToWin > 9 ? 'high' : 'medium',
    };
  }

  return { message: `相手スコア ${opponentFinalScore} 点を超えよう！`, tension: 'medium' };
}
