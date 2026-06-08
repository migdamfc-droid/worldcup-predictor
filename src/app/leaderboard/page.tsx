"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateScore, type Predictions, type ActualResults } from "@/lib/scoring";
import Navbar from "@/components/Navbar";

interface LeaderboardEntry {
  username: string;
  total: number;
  groupPoints: number;
  knockoutPoints: number;
  bonusPoints: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data: resultsRow } = await supabase
      .from("actual_results")
      .select("*")
      .eq("id", 1)
      .single();

    const actual: ActualResults = resultsRow
      ? {
          group_results: resultsRow.group_results || {},
          knockout_results: resultsRow.knockout_results || {},
          tournament_winner: resultsRow.tournament_winner || "",
          top_scorer: resultsRow.top_scorer || "",
          top_assister: resultsRow.top_assister || "",
          best_player: resultsRow.best_player || "",
        }
      : { group_results: {}, knockout_results: {}, tournament_winner: "", top_scorer: "", top_assister: "", best_player: "" };

    const anyResults =
      Object.keys(actual.group_results).length > 0 ||
      Object.keys(actual.knockout_results).length > 0 ||
      actual.tournament_winner;
    setHasResults(!!anyResults);

    const { data: predictions } = await supabase
      .from("predictions")
      .select("user_id, group_predictions, knockout_predictions, tournament_winner, top_scorer, top_assister, best_player");

    if (!predictions) {
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase.from("profiles").select("id, username");
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.username]));

    const leaderboard: LeaderboardEntry[] = predictions.map((pred) => {
      const p: Predictions = {
        group_predictions: pred.group_predictions || {},
        knockout_predictions: pred.knockout_predictions || {},
        tournament_winner: pred.tournament_winner || "",
        top_scorer: pred.top_scorer || "",
        top_assister: pred.top_assister || "",
        best_player: pred.best_player || "",
      };

      const score = calculateScore(p, actual);

      return {
        username: profileMap.get(pred.user_id) || "Unknown",
        ...score,
      };
    });

    leaderboard.sort((a, b) => b.total - a.total);
    setEntries(leaderboard);
    setLoading(false);
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
        <p className="mb-8 text-slate-400">
          {hasResults
            ? "Scores are calculated based on actual results entered by the admin."
            : "Scores will appear once the tournament results start being entered."}
        </p>

        {loading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="mb-4 text-5xl">🏟️</div>
            <h2 className="mb-2 text-xl font-bold">No predictions yet</h2>
            <p className="text-slate-400">Be the first to make your predictions!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <div
                key={entry.username}
                className={`glass-card flex items-center gap-4 p-4 transition-all ${
                  i < 3 ? "border-amber-500/20" : ""
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-bold">
                  {i < 3 ? medals[i] : i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{entry.username}</div>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>Groups: {entry.groupPoints}</span>
                    <span>Knockout: {entry.knockoutPoints}</span>
                    <span>Bonus: {entry.bonusPoints}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-violet-400">{entry.total}</div>
                  <div className="text-xs text-slate-500">points</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
