"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GROUPS, KNOCKOUT_STRUCTURE, ALL_TEAMS } from "@/lib/teams";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Auth from "@/components/Auth";

type Tab = "groups" | "thirdplace" | "knockout" | "extras";

interface PredictionState {
  groupPredictions: Record<string, string[]>;
  thirdPlaceGroups: string[];
  knockoutPredictions: Record<string, string>;
  tournamentWinner: string;
  topScorer: string;
  topAssister: string;
  bestPlayer: string;
}

const defaultGroupPredictions: Record<string, string[]> = Object.fromEntries(
  GROUPS.map((g) => [g.name, g.teams.map((t) => t.code)])
);

const emptyPredictions: PredictionState = {
  groupPredictions: defaultGroupPredictions,
  thirdPlaceGroups: [],
  knockoutPredictions: {},
  tournamentWinner: "",
  topScorer: "",
  topAssister: "",
  bestPlayer: "",
};

const THIRD_PLACE_SLOTS = [
  { matchId: "r32_2", label: "vs 1E" },
  { matchId: "r32_5", label: "vs 1I" },
  { matchId: "r32_7", label: "vs 1A" },
  { matchId: "r32_8", label: "vs 1L" },
  { matchId: "r32_9", label: "vs 1D" },
  { matchId: "r32_10", label: "vs 1G" },
  { matchId: "r32_13", label: "vs 1B" },
  { matchId: "r32_15", label: "vs 1K" },
];

const LOCKOUT_DATE = new Date("2026-06-11T20:00:00Z");

export default function PredictPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("groups");
  const [predictions, setPredictions] = useState<PredictionState>(emptyPredictions);
  const [saveMsg, setSaveMsg] = useState("");
  const [dragState, setDragState] = useState<{ group: string; index: number } | null>(null);
  const [authKey, setAuthKey] = useState(0);
  const locked = new Date() >= LOCKOUT_DATE;

  const checkUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      const { data: pred } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", data.user.id)
        .single();
      if (pred) {
        setPredictions({
          groupPredictions: { ...defaultGroupPredictions, ...(pred.group_predictions || {}) },
          thirdPlaceGroups: pred.knockout_predictions?._thirdPlaceGroups || [],
          knockoutPredictions: pred.knockout_predictions || {},
          tournamentWinner: pred.tournament_winner || "",
          topScorer: pred.top_scorer || "",
          topAssister: pred.top_assister || "",
          bestPlayer: pred.best_player || "",
        });
      }
    }
    setLoading(false);
    setAuthKey((k) => k + 1);
  }, []);

  useEffect(() => { checkUser(); }, [checkUser]);

  const savePredictions = async () => {
    if (!user) return;
    setSaving(true);
    const koWithMeta = {
      ...predictions.knockoutPredictions,
      _thirdPlaceGroups: predictions.thirdPlaceGroups,
    };
    const payload = {
      user_id: user.id,
      group_predictions: predictions.groupPredictions,
      knockout_predictions: koWithMeta,
      tournament_winner: predictions.knockoutPredictions["final"] || "",
      top_scorer: predictions.topScorer,
      top_assister: predictions.topAssister,
      best_player: predictions.bestPlayer,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("predictions")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      await supabase.from("predictions").update(payload).eq("user_id", user.id);
    } else {
      await supabase.from("predictions").insert(payload);
    }

    setSaving(false);
    setSaveMsg("Predictions saved!");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const setGroupOrder = (group: string, order: string[]) => {
    setPredictions((p) => ({
      ...p,
      groupPredictions: { ...p.groupPredictions, [group]: order },
    }));
  };

  const toggleThirdPlaceGroup = (group: string) => {
    setPredictions((p) => {
      const current = [...p.thirdPlaceGroups];
      const idx = current.indexOf(group);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else if (current.length < 8) {
        current.push(group);
      }
      return { ...p, thirdPlaceGroups: current };
    });
  };

  const getThirdPlaceTeam = (slotIndex: number): string | null => {
    const selectedGroups = [...predictions.thirdPlaceGroups].sort();
    if (slotIndex >= selectedGroups.length) return null;
    const group = selectedGroups[slotIndex];
    const groupOrder = predictions.groupPredictions[group];
    if (!groupOrder || !groupOrder[2]) return null;
    return groupOrder[2];
  };

  const setKnockoutWinner = (matchId: string, winner: string) => {
    setPredictions((p) => {
      const newKnockout = { ...p.knockoutPredictions, [matchId]: winner };
      const match = KNOCKOUT_STRUCTURE.find((m) => m.id === matchId);
      if (match?.feedsInto) {
        clearDownstream(newKnockout, match.feedsInto);
      }
      return { ...p, knockoutPredictions: newKnockout };
    });
  };

  const clearDownstream = (ko: Record<string, string>, matchId: string) => {
    const currentWinner = ko[matchId];
    if (!currentWinner) return;
    const match = KNOCKOUT_STRUCTURE.find((m) => m.id === matchId);
    if (!match) return;
    const teamA = resolveTeam(ko, match.seedA);
    const teamB = resolveTeam(ko, match.seedB);
    if (currentWinner !== teamA && currentWinner !== teamB) {
      delete ko[matchId];
      if (match.feedsInto) {
        clearDownstream(ko, match.feedsInto);
      }
    }
  };

  const resolveTeam = (ko: Record<string, string>, seed: string): string | null => {
    if (seed.startsWith("W ")) {
      return ko[seed.slice(2)] || null;
    }
    if (seed.startsWith("3rd_")) {
      const slotIndex = parseInt(seed.slice(4));
      return getThirdPlaceTeam(slotIndex);
    }
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

  const handleDragStart = (group: string, index: number) => {
    setDragState({ group, index });
  };

  const handleDrop = (group: string, dropIndex: number) => {
    if (!dragState || dragState.group !== group) return;
    const order = [...(predictions.groupPredictions[group] || GROUPS.find(g => g.name === group)!.teams.map(t => t.code))];
    const [moved] = order.splice(dragState.index, 1);
    order.splice(dropIndex, 0, moved);
    setGroupOrder(group, order);
    setDragState(null);
  };

  const moveTeam = (group: string, index: number, direction: "up" | "down") => {
    if (locked) return;
    const order = [...(predictions.groupPredictions[group] || GROUPS.find(g => g.name === group)!.teams.map(t => t.code))];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.length) return;
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    setGroupOrder(group, order);
  };

  if (loading) {
    return (
      <>
        <Navbar key={authKey} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-lg text-slate-400">Loading...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar key={authKey} />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h1 className="mb-2 text-center text-3xl font-bold">Make Your Predictions</h1>
          <p className="mb-8 text-center text-slate-400">Sign in to start predicting</p>
          <Auth onAuth={checkUser} />
        </div>
      </>
    );
  }

  const tabItems: { key: Tab; label: string }[] = [
    { key: "groups", label: "Group Stage" },
    { key: "thirdplace", label: "3rd Place" },
    { key: "knockout", label: "Knockout" },
    { key: "extras", label: "Bonus Picks" },
  ];

  return (
    <>
      <Navbar key={authKey} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Your Predictions</h1>
          {!locked && (
            <div className="flex items-center gap-3">
              {saveMsg && <span className="text-sm text-zinc-300">{saveMsg}</span>}
              <button onClick={savePredictions} disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save Predictions"}
              </button>
            </div>
          )}
        </div>

        <div className="mb-8 flex gap-6 border-b border-white/10 overflow-x-auto">
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

        {locked && (
          <div className="mb-6 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-300">
            Predictions are locked. The tournament has started.
          </div>
        )}

        {/* Group Stage */}
        {tab === "groups" && (
          <div className="animate-fade-in">
            <p className="mb-6 text-slate-400">
              Reorder teams to predict the final standings for each group. Position 1 = group winner.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {GROUPS.map((group) => {
                const order =
                  predictions.groupPredictions[group.name] ||
                  group.teams.map((t) => t.code);
                return (
                  <div key={group.name} className="glass-card p-4">
                    <h3 className="mb-3 text-sm font-bold text-zinc-400">
                      Group {group.name}
                    </h3>
                    <div className="space-y-2">
                      {order.map((code, i) => {
                        const team = group.teams.find((t) => t.code === code);
                        if (!team) return null;
                        return (
                          <div
                            key={code}
                            draggable={!locked}
                            onDragStart={() => !locked && handleDragStart(group.name, i)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(group.name, i)}
                            className="team-slot"
                          >
                            {!locked && (
                              <div className="flex flex-col -my-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveTeam(group.name, i, "up"); }}
                                  disabled={i === 0}
                                  className="text-zinc-500 hover:text-white disabled:opacity-20 p-0.5"
                                  aria-label="Move up"
                                >
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveTeam(group.name, i, "down"); }}
                                  disabled={i === order.length - 1}
                                  className="text-zinc-500 hover:text-white disabled:opacity-20 p-0.5"
                                  aria-label="Move down"
                                >
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                </button>
                              </div>
                            )}
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                              {i + 1}
                            </span>
                            <span className="text-lg">{team.flag}</span>
                            <span className="font-medium text-sm">{team.name}</span>
                            {i < 2 && (
                              <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400 hidden sm:inline">
                                Qualifies
                              </span>
                            )}
                            {i === 2 && (
                              <span className="ml-auto rounded-full bg-orange-500/15 px-2 py-0.5 text-xs text-orange-400 hidden sm:inline">
                                Possible
                              </span>
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

        {/* Third Place Selection */}
        {tab === "thirdplace" && (
          <div className="animate-fade-in">
            <p className="mb-2 text-slate-400">
              Select which <strong className="text-white">8 of 12</strong> third-place teams will advance to the knockout rounds.
            </p>
            <p className="mb-6 text-sm text-slate-500">
              {predictions.thirdPlaceGroups.length}/8 selected
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {GROUPS.map((group) => {
                const order =
                  predictions.groupPredictions[group.name] ||
                  group.teams.map((t) => t.code);
                const thirdTeamCode = order[2];
                const thirdTeam = group.teams.find((t) => t.code === thirdTeamCode);
                const isSelected = predictions.thirdPlaceGroups.includes(group.name);
                const isFull = predictions.thirdPlaceGroups.length >= 8 && !isSelected;

                return (
                  <button
                    key={group.name}
                    onClick={() => !locked && !isFull && toggleThirdPlaceGroup(group.name)}
                    disabled={locked || isFull}
                    className={`glass-card p-4 text-left transition-all ${
                      isSelected
                        ? "border-zinc-600 bg-zinc-800"
                        : isFull
                        ? "opacity-40"
                        : "hover:border-white/20"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-400">Group {group.name}</span>
                      {isSelected && (
                        <span className="rounded-full bg-zinc-700/50 px-2 py-0.5 text-xs font-bold text-zinc-300">
                          Advances
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                        3
                      </span>
                      <span className="text-lg">{thirdTeam?.flag || "❓"}</span>
                      <span className="font-medium">{thirdTeam?.name || "Set group first"}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {predictions.thirdPlaceGroups.length === 8 && (
              <div className="mt-6 glass-card p-4">
                <h3 className="mb-3 text-sm font-bold text-zinc-300">Advancing 3rd-place teams</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[...predictions.thirdPlaceGroups].sort().map((g, i) => {
                    const order = predictions.groupPredictions[g] || GROUPS.find(gr => gr.name === g)!.teams.map(t => t.code);
                    const team = ALL_TEAMS.find(t => t.code === order[2]);
                    return (
                      <div key={g} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
                        <span>{team?.flag}</span>
                        <span>{team?.name}</span>
                        <span className="ml-auto text-xs text-slate-500">{THIRD_PLACE_SLOTS[i]?.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Knockout */}
        {tab === "knockout" && (
          <div className="animate-fade-in">
            <p className="mb-6 text-slate-400">
              Click on the team you think will win each match. Teams are seeded from your group and 3rd-place predictions.
            </p>
            {predictions.thirdPlaceGroups.length < 8 && (
              <div className="mb-6 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-sm text-zinc-300">
                You need to select 8 third-place teams first.{" "}
                <button onClick={() => setTab("thirdplace")} className="underline">
                  Go to 3rd Place tab
                </button>
              </div>
            )}
            <div className="overflow-x-auto pb-4">
              <div className="flex min-w-[1200px] gap-4">
                {["R32", "R16", "QF", "SF", "Final"].map((round) => {
                  const matches = KNOCKOUT_STRUCTURE.filter((m) => m.round === round);
                  return (
                    <div key={round} className="flex-1">
                      <h3 className="mb-3 text-center text-sm font-bold text-zinc-400">
                        {round === "R32"
                          ? "Round of 32"
                          : round === "R16"
                          ? "Round of 16"
                          : round === "QF"
                          ? "Quarter-Finals"
                          : round === "SF"
                          ? "Semi-Finals"
                          : "Final"}
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
                                <button
                                  onClick={() => !locked && teamA && setKnockoutWinner(match.id, teamA)}
                                  disabled={locked || !teamA}
                                  className={`w-full text-left ${
                                    winner === teamA && teamA ? "knockout-team-winner" : "knockout-team"
                                  }`}
                                >
                                  <span className="mr-2">{displayA.flag}</span>
                                  <span className="text-xs">{displayA.name}</span>
                                </button>
                                <button
                                  onClick={() => !locked && teamB && setKnockoutWinner(match.id, teamB)}
                                  disabled={locked || !teamB}
                                  className={`w-full text-left ${
                                    winner === teamB && teamB ? "knockout-team-winner" : "knockout-team"
                                  }`}
                                >
                                  <span className="mr-2">{displayB.flag}</span>
                                  <span className="text-xs">{displayB.name}</span>
                                </button>
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

        {/* Extras */}
        {tab === "extras" && (
          <div className="animate-fade-in">
            <p className="mb-6 text-slate-400">Make your bonus predictions for extra points!</p>
            {/* Tournament winner derived from knockout bracket */}
            {(() => {
              const finalWinner = predictions.knockoutPredictions["final"];
              const display = getTeamDisplay(finalWinner || null);
              return (
                <div className="mb-6 glass-card p-6">
                  <h3 className="mb-1 text-lg font-bold">Your Predicted Winner</h3>
                  <p className="mb-3 text-xs text-slate-500">+6 points if correct — set by your knockout bracket picks</p>
                  <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
                    <span className="text-2xl">{display.flag}</span>
                    <span className="text-lg font-semibold">{finalWinner ? display.name : "Complete your knockout bracket to set this"}</span>
                  </div>
                </div>
              );
            })()}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="glass-card p-6">
                <h3 className="mb-1 text-lg font-bold">Top Scorer</h3>
                <p className="mb-3 text-xs text-slate-500">+2 points if correct</p>
                <input
                  type="text"
                  value={predictions.topScorer}
                  onChange={(e) => setPredictions((p) => ({ ...p, topScorer: e.target.value }))}
                  disabled={locked}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-white outline-none focus:border-zinc-500 disabled:opacity-50"
                  placeholder="e.g. Kylian Mbappé"
                />
              </div>
              <div className="glass-card p-6">
                <h3 className="mb-1 text-lg font-bold">Top Assister</h3>
                <p className="mb-3 text-xs text-slate-500">+2 points if correct</p>
                <input
                  type="text"
                  value={predictions.topAssister}
                  onChange={(e) => setPredictions((p) => ({ ...p, topAssister: e.target.value }))}
                  disabled={locked}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-white outline-none focus:border-zinc-500 disabled:opacity-50"
                  placeholder="e.g. Kevin De Bruyne"
                />
              </div>
              <div className="glass-card p-6">
                <h3 className="mb-1 text-lg font-bold">Best Player</h3>
                <p className="mb-3 text-xs text-slate-500">+3 points if correct</p>
                <input
                  type="text"
                  value={predictions.bestPlayer}
                  onChange={(e) => setPredictions((p) => ({ ...p, bestPlayer: e.target.value }))}
                  disabled={locked}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-white outline-none focus:border-zinc-500 disabled:opacity-50"
                  placeholder="e.g. Lionel Messi"
                />
              </div>
            </div>
            <div className="mt-8 glass-card p-6">
              <h3 className="mb-4 text-lg font-bold">Scoring System</h3>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Group: All 4 correct", "+4 pts", "text-zinc-300"],
                  ["Group: 3 correct", "+3 pts", "text-zinc-300"],
                  ["Group: 2 correct", "+2 pts", "text-zinc-300"],
                  ["Group: 1 correct", "+1 pt", "text-zinc-300"],
                  ["Knockout: Correct result", "+3 pts", "text-zinc-300"],
                  ["Bracket: Tournament winner", "+6 pts", "text-zinc-300"],
                  ["Top scorer", "+2 pts", "text-zinc-300"],
                  ["Top assister", "+2 pts", "text-zinc-300"],
                  ["Best player", "+3 pts", "text-zinc-300"],
                ].map(([label, pts, color]) => (
                  <div key={label} className="flex justify-between rounded-lg bg-white/5 px-4 py-2">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-bold ${color}`}>{pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
