export interface Predictions {
  group_predictions: Record<string, string[]>;
  knockout_predictions: Record<string, string>;
  tournament_winner: string;
  top_scorer: string;
  top_assister: string;
  best_player: string;
}

export interface ActualResults {
  group_results: Record<string, string[]>;
  knockout_results: Record<string, string>;
  tournament_winner: string;
  top_scorer: string;
  top_assister: string;
  best_player: string;
}

export function calculateScore(pred: Predictions, actual: ActualResults): {
  total: number;
  groupPoints: number;
  knockoutPoints: number;
  bonusPoints: number;
  breakdown: Record<string, number>;
} {
  let groupPoints = 0;
  let knockoutPoints = 0;
  let bonusPoints = 0;
  const breakdown: Record<string, number> = {};

  if (actual.group_results && pred.group_predictions) {
    for (const group of Object.keys(actual.group_results)) {
      const predicted = pred.group_predictions[group];
      const actualOrder = actual.group_results[group];
      if (!predicted || !actualOrder) continue;

      let correct = 0;
      for (let i = 0; i < 4; i++) {
        if (predicted[i] === actualOrder[i]) correct++;
      }

      let pts = 0;
      if (correct === 4) pts = 4;
      else if (correct === 3) pts = 3;
      else if (correct === 2) pts = 2;
      else if (correct === 1) pts = 1;

      breakdown[`group_${group}`] = pts;
      groupPoints += pts;
    }
  }

  if (actual.knockout_results && pred.knockout_predictions) {
    for (const matchId of Object.keys(actual.knockout_results)) {
      const predictedWinner = pred.knockout_predictions[matchId];
      const actualWinner = actual.knockout_results[matchId];
      if (!predictedWinner || !actualWinner) continue;

      if (matchId === "final") {
        if (predictedWinner === actualWinner) {
          breakdown[matchId] = 3;
          knockoutPoints += 3;
        }
      } else {
        if (predictedWinner === actualWinner) {
          breakdown[matchId] = 3;
          knockoutPoints += 3;
        }
      }
    }
  }

  if (actual.tournament_winner && pred.tournament_winner === actual.tournament_winner) {
    bonusPoints += 6;
    breakdown["tournament_winner"] = 6;
  }
  if (actual.top_scorer && pred.top_scorer === actual.top_scorer) {
    bonusPoints += 2;
    breakdown["top_scorer"] = 2;
  }
  if (actual.top_assister && pred.top_assister === actual.top_assister) {
    bonusPoints += 2;
    breakdown["top_assister"] = 2;
  }
  if (actual.best_player && pred.best_player === actual.best_player) {
    bonusPoints += 3;
    breakdown["best_player"] = 3;
  }

  return {
    total: groupPoints + knockoutPoints + bonusPoints,
    groupPoints,
    knockoutPoints,
    bonusPoints,
    breakdown,
  };
}
