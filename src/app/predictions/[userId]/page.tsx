"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { GROUPS, KNOCKOUT_STRUCTURE, ALL_TEAMS } from "@/lib/teams";
import { calculateScore, type Predictions, type ActualResults } from "@/lib/scoring";
import Navbar from "@/components/Navbar";

type Tab = "groups" | "knockout" | "extras";

interface PredictionData {
  groupPredictions: Record<string, string[]>;
  thirdPlaceGroups: string[];
  knockoutPredictions: Record<string, string>;
  topScorer: string;
  topAssister: string;
  bestPlayer: string;
}

const defaultGroupPredictions: Record<string, string[]> = Object.fromEntries(
  GROUPS.map((g) => [g.name, g.teams.map((t) => t.code)])
);

export default function ViewPredictionsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [username, setUsername] = useState("");
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("groups");
  const [score, setScore] = useState<{ total: number; groupPoints: number; knockoutPoints: number; bonusPoints: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const shareLink = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${username}'s WC 2026 Predictions`, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, [userId]);

  const loadPredictions = async () => {
    const [{ data: profile }, { data: pred }, { data: resultsRow }] = await Promise.all([
      supabase.from("profiles").select("username").eq("id", userId).single(),
      supabase.from("predictions").select("*").eq("user_id", userId).single(),
      supabase.from("actual_results").select("*").eq("id", 1).single(),
    ]);

    if (profile) setUsername(profile.username);
    if (pred) {
      const predData: PredictionData = {
        groupPredictions: { ...defaultGroupPredictions, ...(pred.group_predictions || {}) },
        thirdPlaceGroups: pred.knockout_predictions?._thirdPlaceGroups || [],
        knockoutPredictions: pred.knockout_predictions || {},
        topScorer: pred.top_scorer || "",
        topAssister: pred.top_assister || "",
        bestPlayer: pred.best_player || "",
      };
      setPredictions(predData);

      if (resultsRow) {
        const actual: ActualResults = {
          group_results: resultsRow.group_results || {},
          knockout_results: resultsRow.knockout_results || {},
          tournament_winner: resultsRow.tournament_winner || "",
          top_scorer: resultsRow.top_scorer || "",
          top_assister: resultsRow.top_assister || "",
          best_player: resultsRow.best_player || "",
        };
        const p: Predictions = {
          group_predictions: predData.groupPredictions,
          knockout_predictions: predData.knockoutPredictions,
          tournament_winner: predData.knockoutPredictions["final"] || "",
          top_scorer: predData.topScorer,
          top_assister: predData.topAssister,
          best_player: predData.bestPlayer,
        };
        const s = calculateScore(p, actual);
        if (s.total > 0) setScore(s);
      }
    }
    setLoading(false);
  };

  const getThirdPlaceTeam = (slotIndex: number): string | null => {
    if (!predictions) return null;
    const selectedGroups = [...predictions.thirdPlaceGroups].sort();
    if (slotIndex >= selectedGroups.length) return null;
    const group = selectedGroups[slotIndex];
    const groupOrder = predictions.groupPredictions[group];
    if (!groupOrder || !groupOrder[2]) return null;
    return groupOrder[2];
  };

  const resolveTeam = (ko: Record<string, string>, seed: string): string | null => {
    if (seed.startsWith("W ")) return ko[seed.slice(2)] || null;
    if (seed.startsWith("3rd_")) {
      const slotIndex = parseInt(seed.slice(4));
      return getThirdPlaceTeam(slotIndex);
    }
    if (!predictions) return null;
    const position = parseInt(seed[0]) - 1;
    const group = seed.slice(1);
    const groupOrder = predictions.groupPredictions[group];
    if (!groupOrder || !groupOrder[position]) return null;
    return groupOrder[position];
  };

  const getTeamDisplay = (code: string | null): { name: string; flag: string } => {
    if (!code) return { name: "TBD", flag: "❓" };
    const team = ALL_TEAMS.find((t) => t.code === code);
    return team ? { name: team.name, flag: team.flag } : { name: code, flag: "❓" };
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </>
    );
  }

  if (!predictions) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <h1 className="mb-2 text-2xl font-bold">{username || "User"}</h1>
          <p className="text-zinc-500">This user hasn&apos;t made any predictions yet.</p>
        </div>
      </>
    );
  }

  const tabItems: { key: Tab; label: string }[] = [
    { key: "groups", label: "Group Stage" },
    { key: "knockout", label: "Knockout" },
    { key: "extras", label: "Bonus Picks" },
  ];

  const finalWinner = predictions.knockoutPredictions["final"];
  const winnerDisplay = getTeamDisplay(finalWinner || null);

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{username}&apos;s Predictions</h1>
            <p className="text-sm text-zinc-500">View only</p>
            <button onClick={shareLink} className="mt-1 text-xs text-zinc-400 hover:text-white">
              {copied ? "Link copied!" : "Share"}
            </button>
          </div>
          {score && (
            <div className="glass-card flex items-center gap-4 px-5 py-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{score.total}</div>
                <div className="text-[10px] text-zinc-500 uppercase">Total</div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="flex gap-4 text-xs text-zinc-400">
                <div className="text-center"><div className="font-semibold text-white">{score.groupPoints}</div>Groups</div>
                <div className="text-center"><div className="font-semibold text-white">{score.knockoutPoints}</div>Knockout</div>
                <div className="text-center"><div className="font-semibold text-white">{score.bonusPoints}</div>Bonus</div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 flex gap-6 border-b border-zinc-800 overflow-x-auto">
          {tabItems.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap pb-3 text-sm font-semibold uppercase tracking-wide ${
                tab === t.key ? "tab-active" : "tab-inactive"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "groups" && (
          <div className="animate-fade-in">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {GROUPS.map((group) => {
                const order = predictions.groupPredictions[group.name] || group.teams.map((t) => t.code);
                return (
                  <div key={group.name} className="glass-card p-4">
                    <h3 className="mb-3 text-sm font-bold text-zinc-400">Group {group.name}</h3>
                    <div className="space-y-2">
                      {order.map((code, i) => {
                        const team = group.teams.find((t) => t.code === code);
                        if (!team) return null;
                        return (
                          <div key={code} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{i + 1}</span>
                            <span className="text-lg">{team.flag}</span>
                            <span className="font-medium">{team.name}</span>
                            {i < 2 && (
                              <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">Qualifies</span>
                            )}
                            {i === 2 && (
                              <span className="ml-auto rounded-full bg-orange-500/15 px-2 py-0.5 text-xs text-orange-400">Possible</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "knockout" && (
          <div className="animate-fade-in">
            <div className="overflow-x-auto pb-4">
              <div className="flex min-w-[1200px] gap-4">
                {["R32", "R16", "QF", "SF", "Final"].map((round) => {
                  const matches = KNOCKOUT_STRUCTURE.filter((m) => m.round === round);
                  return (
                    <div key={round} className="flex-1">
                      <h3 className="mb-3 text-center text-sm font-bold text-zinc-400">
                        {round === "R32" ? "Round of 32" : round === "R16" ? "Round of 16" : round === "QF" ? "Quarter-Finals" : round === "SF" ? "Semi-Finals" : "Final"}
                      </h3>
                      <div className="flex flex-col justify-around gap-2" style={{ minHeight: round === "R32" ? "auto" : "100%" }}>
                        {matches.map((match) => {
                          const teamA = resolveTeam(predictions.knockoutPredictions, match.seedA);
                          const teamB = resolveTeam(predictions.knockoutPredictions, match.seedB);
                          const displayA = getTeamDisplay(teamA);
                          const displayB = getTeamDisplay(teamB);
                          const winner = predictions.knockoutPredictions[match.id];

                          return (
                            <div key={match.id} className="glass-card p-2">
                              <div className="space-y-1">
                                <div className={`rounded-lg border px-3 py-2 text-sm ${winner === teamA && teamA ? "border-zinc-500 bg-zinc-800 text-white" : "border-zinc-800 bg-zinc-900/50"}`}>
                                  <span className="mr-2">{displayA.flag}</span>
                                  <span className="text-xs">{displayA.name}</span>
                                </div>
                                <div className={`rounded-lg border px-3 py-2 text-sm ${winner === teamB && teamB ? "border-zinc-500 bg-zinc-800 text-white" : "border-zinc-800 bg-zinc-900/50"}`}>
                                  <span className="mr-2">{displayB.flag}</span>
                                  <span className="text-xs">{displayB.name}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "extras" && (
          <div className="animate-fade-in">
            <div className="mb-6 glass-card p-6">
              <h3 className="mb-1 text-lg font-bold">Predicted Winner</h3>
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
                <span className="text-2xl">{winnerDisplay.flag}</span>
                <span className="text-lg font-semibold">{finalWinner ? winnerDisplay.name : "Not set"}</span>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                ["Top Scorer", predictions.topScorer],
                ["Top Assister", predictions.topAssister],
                ["Best Player", predictions.bestPlayer],
              ].map(([label, value]) => (
                <div key={label} className="glass-card p-6">
                  <h3 className="mb-2 text-sm font-bold text-zinc-400">{label}</h3>
                  <p className="text-lg font-semibold">{value || "Not set"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
