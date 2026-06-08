"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GROUPS, ALL_TEAMS } from "@/lib/teams";
import Navbar from "@/components/Navbar";

export default function AdminPage() {
  const [groupResults, setGroupResults] = useState<Record<string, string[]>>({});
  const [knockoutResults, setKnockoutResults] = useState<Record<string, string>>({});
  const [tournamentWinner, setTournamentWinner] = useState("");
  const [topScorer, setTopScorer] = useState("");
  const [topAssister, setTopAssister] = useState("");
  const [bestPlayer, setBestPlayer] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase
      .from("actual_results")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setGroupResults(data.group_results || {});
          setKnockoutResults(data.knockout_results || {});
          setTournamentWinner(data.tournament_winner || "");
          setTopScorer(data.top_scorer || "");
          setTopAssister(data.top_assister || "");
          setBestPlayer(data.best_player || "");
        }
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("actual_results")
      .update({
        group_results: groupResults,
        knockout_results: knockoutResults,
        tournament_winner: tournamentWinner,
        top_scorer: topScorer,
        top_assister: topAssister,
        best_player: bestPlayer,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setSaving(false);
    setMsg("Results saved!");
    setTimeout(() => setMsg(""), 3000);
  };

  const setGroupOrder = (group: string, index: number, code: string) => {
    const current = groupResults[group] || ["", "", "", ""];
    const updated = [...current];
    updated[index] = code;
    setGroupResults({ ...groupResults, [group]: updated });
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin — Enter Results</h1>
            <p className="text-sm text-slate-400">
              Enter actual tournament results to calculate scores.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-sm text-zinc-300">{msg}</span>}
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Results"}
            </button>
          </div>
        </div>

        <h2 className="mb-4 text-lg font-bold">Group Results</h2>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((group) => (
            <div key={group.name} className="glass-card p-4">
              <h3 className="mb-3 text-sm font-bold text-zinc-400">Group {group.name}</h3>
              {[0, 1, 2, 3].map((pos) => (
                <div key={pos} className="mb-2 flex items-center gap-2">
                  <span className="w-6 text-center text-xs font-bold text-slate-500">
                    {pos + 1}.
                  </span>
                  <select
                    value={(groupResults[group.name] || [])[pos] || ""}
                    onChange={(e) => setGroupOrder(group.name, pos, e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none"
                  >
                    <option value="">—</option>
                    {group.teams.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.flag} {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ))}
        </div>

        <h2 className="mb-4 text-lg font-bold">Bonus Results</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass-card p-4">
            <label className="mb-2 block text-sm text-slate-400">Tournament Winner</label>
            <select
              value={tournamentWinner}
              onChange={(e) => setTournamentWinner(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
            >
              <option value="">—</option>
              {ALL_TEAMS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="glass-card p-4">
            <label className="mb-2 block text-sm text-slate-400">Top Scorer</label>
            <input
              value={topScorer}
              onChange={(e) => setTopScorer(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
              placeholder="Player name"
            />
          </div>
          <div className="glass-card p-4">
            <label className="mb-2 block text-sm text-slate-400">Top Assister</label>
            <input
              value={topAssister}
              onChange={(e) => setTopAssister(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
              placeholder="Player name"
            />
          </div>
          <div className="glass-card p-4">
            <label className="mb-2 block text-sm text-slate-400">Best Player</label>
            <input
              value={bestPlayer}
              onChange={(e) => setBestPlayer(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
              placeholder="Player name"
            />
          </div>
        </div>
      </div>
    </>
  );
}
