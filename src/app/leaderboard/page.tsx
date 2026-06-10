"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { calculateScore, type Predictions, type ActualResults } from "@/lib/scoring";
import Navbar from "@/components/Navbar";
import { SkeletonRow } from "@/components/Skeleton";

interface LeaderboardEntry {
  userId: string;
  username: string;
  total: number;
  groupPoints: number;
  knockoutPoints: number;
  bonusPoints: number;
}

interface League {
  id: string;
  name: string;
  code: string;
}

export default function LeaderboardPage() {
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasResults, setHasResults] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeTab, setActiveTab] = useState<string>("global");
  const [leagueMembers, setLeagueMembers] = useState<Record<string, string[]>>({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [copiedLeagueId, setCopiedLeagueId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadLeagues(user.id);
    }
    await loadLeaderboard();
  };

  const loadLeagues = async (uid: string) => {
    const { data: memberships } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", uid);

    if (!memberships || memberships.length === 0) return;

    const leagueIds = memberships.map((m) => m.league_id);
    const { data: leagueRows } = await supabase
      .from("leagues")
      .select("id, name, code")
      .in("id", leagueIds);

    if (leagueRows) setLeagues(leagueRows);

    const { data: allMembers } = await supabase
      .from("league_members")
      .select("league_id, user_id")
      .in("league_id", leagueIds);

    if (allMembers) {
      const map: Record<string, string[]> = {};
      for (const m of allMembers) {
        if (!map[m.league_id]) map[m.league_id] = [];
        map[m.league_id].push(m.user_id);
      }
      setLeagueMembers(map);
    }
  };

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
        userId: pred.user_id,
        username: profileMap.get(pred.user_id) || "Unknown",
        ...score,
      };
    });

    leaderboard.sort((a, b) => b.total - a.total);
    setAllEntries(leaderboard);
    setLoading(false);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleCreate = async () => {
    if (!newLeagueName.trim()) { setModalError("Enter a league name"); return; }
    if (!userId) return;
    setModalLoading(true);
    setModalError("");

    const code = generateCode();
    const { data: league, error } = await supabase
      .from("leagues")
      .insert({ name: newLeagueName.trim(), code, created_by: userId })
      .select()
      .single();

    if (error) { setModalError(error.message); setModalLoading(false); return; }

    await supabase.from("league_members").insert({ league_id: league.id, user_id: userId });

    setShowCreateModal(false);
    setNewLeagueName("");
    setModalLoading(false);
    await loadLeagues(userId);
    setActiveTab(league.id);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setModalError("Enter an invite code"); return; }
    if (!userId) return;
    setModalLoading(true);
    setModalError("");

    const { data: league, error: findErr } = await supabase
      .from("leagues")
      .select("id, name, code")
      .eq("code", joinCode.trim().toUpperCase())
      .single();

    if (findErr || !league) { setModalError("League not found"); setModalLoading(false); return; }

    const { error: joinErr } = await supabase
      .from("league_members")
      .insert({ league_id: league.id, user_id: userId });

    if (joinErr) {
      if (joinErr.code === "23505") setModalError("You're already in this league");
      else setModalError(joinErr.message);
      setModalLoading(false);
      return;
    }

    setShowJoinModal(false);
    setJoinCode("");
    setModalLoading(false);
    await loadLeagues(userId);
    setActiveTab(league.id);
  };

  const copyCode = (code: string, leagueId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedLeagueId(leagueId);
    setTimeout(() => setCopiedLeagueId(null), 2000);
  };

  const filteredEntries = activeTab === "global"
    ? allEntries
    : allEntries.filter((e) => leagueMembers[activeTab]?.includes(e.userId));

  const activeLeague = leagues.find((l) => l.id === activeTab);

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
              <p className="text-sm text-zinc-500">
                {hasResults
                  ? "Scores update automatically as results come in."
                  : "Scores will appear once tournament results start."}
              </p>
            </div>
            {userId && (
              <div className="flex gap-2">
                <button onClick={() => { setShowCreateModal(true); setModalError(""); }} className="btn-secondary text-sm">
                  Create League
                </button>
                <button onClick={() => { setShowJoinModal(true); setModalError(""); }} className="btn-primary text-sm">
                  Join League
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-px">
          <button
            onClick={() => setActiveTab("global")}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium ${
              activeTab === "global" ? "tab-active" : "tab-inactive"
            }`}
          >
            Global
          </button>
          {leagues.map((league) => (
            <button
              key={league.id}
              onClick={() => setActiveTab(league.id)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium ${
                activeTab === league.id ? "tab-active" : "tab-inactive"
              }`}
            >
              {league.name}
            </button>
          ))}
        </div>

        {/* League info bar */}
        {activeLeague && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 px-4 py-3">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Invite code: <span className="font-mono font-semibold text-zinc-900 dark:text-white">{activeLeague.code}</span>
            </div>
            <button
              onClick={() => copyCode(activeLeague.code, activeLeague.id)}
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              {copiedLeagueId === activeLeague.id ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : filteredEntries.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <svg className="mx-auto mb-4 h-10 w-10 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <h2 className="mb-2 text-xl font-bold">No predictions yet</h2>
            <p className="text-zinc-500">
              {activeTab === "global"
                ? "Be the first to make your predictions!"
                : "No one in this league has made predictions yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry, i) => (
              <div
                key={entry.userId}
                className={`glass-card flex items-center gap-4 p-4 transition-all ${
                  i < 3 ? "border-zinc-700" : ""
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  i === 0 ? "bg-zinc-900/15 text-zinc-900 dark:bg-white/15 dark:text-white" :
                  i === 1 ? "bg-zinc-300/50 text-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-300" :
                  i === 2 ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" :
                  "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500"
                }`}>
                  {i + 1}
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {entry.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/predictions/${entry.userId}`} className="font-semibold hover:underline truncate block">{entry.username}</Link>
                  <div className="flex gap-3 text-xs text-zinc-500">
                    <span>Groups: {entry.groupPoints}</span>
                    <span>Knockout: {entry.knockoutPoints}</span>
                    <span>Bonus: {entry.bonusPoints}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">{entry.total}</div>
                  <div className="text-xs text-zinc-500">points</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/scores" className="btn-secondary text-sm">Live Scores</Link>
          <Link href="/compare" className="btn-secondary text-sm">Head to Head</Link>
        </div>

        {/* Stats */}
        {allEntries.length > 0 && activeTab === "global" && (
          <div className="mt-10 text-sm text-zinc-500">
            {allEntries.length} prediction{allEntries.length !== 1 ? "s" : ""} submitted
          </div>
        )}
      </div>

      {/* Create League Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">Create a League</h2>
            <input
              type="text"
              value={newLeagueName}
              onChange={(e) => setNewLeagueName(e.target.value)}
              className="mb-4 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-zinc-500"
              placeholder="League name"
              autoFocus
            />
            {modalError && <p className="mb-3 text-sm text-red-400">{modalError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={modalLoading} className="btn-primary flex-1 text-sm">
                {modalLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join League Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowJoinModal(false)}>
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold">Join a League</h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="mb-4 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 font-mono text-white outline-none focus:border-zinc-500"
              placeholder="Enter invite code"
              maxLength={6}
              autoFocus
            />
            {modalError && <p className="mb-3 text-sm text-red-400">{modalError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowJoinModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleJoin} disabled={modalLoading} className="btn-primary flex-1 text-sm">
                {modalLoading ? "Joining..." : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
