"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GROUPS, ALL_TEAMS } from "@/lib/teams";
import Navbar from "@/components/Navbar";

interface UserPred {
  userId: string;
  username: string;
  groupPredictions: Record<string, string[]>;
  knockoutPredictions: Record<string, string>;
  topScorer: string;
  topAssister: string;
  bestPlayer: string;
}

const defaultGroupPredictions: Record<string, string[]> = Object.fromEntries(
  GROUPS.map((g) => [g.name, g.teams.map((t) => t.code)])
);

export default function ComparePage() {
  const [users, setUsers] = useState<UserPred[]>([]);
  const [loading, setLoading] = useState(true);
  const [userA, setUserA] = useState("");
  const [userB, setUserB] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data: predictions } = await supabase
      .from("predictions")
      .select("user_id, group_predictions, knockout_predictions, top_scorer, top_assister, best_player");
    const { data: profiles } = await supabase.from("profiles").select("id, username");
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.username]));

    const result: UserPred[] = (predictions || []).map((pred) => ({
      userId: pred.user_id,
      username: profileMap.get(pred.user_id) || "Unknown",
      groupPredictions: { ...defaultGroupPredictions, ...(pred.group_predictions || {}) },
      knockoutPredictions: pred.knockout_predictions || {},
      topScorer: pred.top_scorer || "",
      topAssister: pred.top_assister || "",
      bestPlayer: pred.best_player || "",
    }));

    setUsers(result);
    if (result.length >= 2) {
      setUserA(result[0].userId);
      setUserB(result[1].userId);
    }
    setLoading(false);
  };

  const a = users.find((u) => u.userId === userA);
  const b = users.find((u) => u.userId === userB);

  const getFlag = (code: string) => ALL_TEAMS.find((t) => t.code === code)?.flag || "";
  const getName = (code: string) => ALL_TEAMS.find((t) => t.code === code)?.name || code;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold">Head to Head</h1>
        <p className="mb-6 text-sm text-zinc-500">Compare predictions between two users.</p>

        {loading ? (
          <div className="text-center text-zinc-500">Loading...</div>
        ) : users.length < 2 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-zinc-500">Need at least 2 users with predictions to compare.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4">
              <select
                value={userA}
                onChange={(e) => setUserA(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white outline-none"
              >
                {users.map((u) => (
                  <option key={u.userId} value={u.userId}>{u.username}</option>
                ))}
              </select>
              <select
                value={userB}
                onChange={(e) => setUserB(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-white outline-none"
              >
                {users.map((u) => (
                  <option key={u.userId} value={u.userId}>{u.username}</option>
                ))}
              </select>
            </div>

            {a && b && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Group Winners</h2>
                <div className="space-y-2">
                  {GROUPS.map((group) => {
                    const aWinner = a.groupPredictions[group.name]?.[0];
                    const bWinner = b.groupPredictions[group.name]?.[0];
                    const same = aWinner === bWinner;
                    return (
                      <div key={group.name} className="glass-card flex items-center px-4 py-3">
                        <span className="w-16 text-sm font-bold text-zinc-400">Group {group.name}</span>
                        <div className={`flex-1 text-center text-sm ${same ? "text-zinc-300" : "text-white font-semibold"}`}>
                          {getFlag(aWinner)} {getName(aWinner)}
                        </div>
                        <div className="w-8 text-center">
                          {same ? (
                            <span className="text-xs text-emerald-400">Same</span>
                          ) : (
                            <span className="text-xs text-zinc-500">vs</span>
                          )}
                        </div>
                        <div className={`flex-1 text-center text-sm ${same ? "text-zinc-300" : "text-white font-semibold"}`}>
                          {getFlag(bWinner)} {getName(bWinner)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <h2 className="text-lg font-semibold">Tournament Winner</h2>
                <div className="glass-card flex items-center px-4 py-3">
                  <span className="w-16 text-sm font-bold text-zinc-400">Winner</span>
                  <div className="flex-1 text-center text-sm font-semibold">
                    {a.knockoutPredictions["final"] ? `${getFlag(a.knockoutPredictions["final"])} ${getName(a.knockoutPredictions["final"])}` : "Not set"}
                  </div>
                  <div className="w-8 text-center">
                    {a.knockoutPredictions["final"] === b.knockoutPredictions["final"] ? (
                      <span className="text-xs text-emerald-400">Same</span>
                    ) : (
                      <span className="text-xs text-zinc-500">vs</span>
                    )}
                  </div>
                  <div className="flex-1 text-center text-sm font-semibold">
                    {b.knockoutPredictions["final"] ? `${getFlag(b.knockoutPredictions["final"])} ${getName(b.knockoutPredictions["final"])}` : "Not set"}
                  </div>
                </div>

                <h2 className="text-lg font-semibold">Bonus Picks</h2>
                <div className="space-y-2">
                  {[
                    ["Top Scorer", a.topScorer, b.topScorer],
                    ["Top Assister", a.topAssister, b.topAssister],
                    ["Best Player", a.bestPlayer, b.bestPlayer],
                  ].map(([label, aVal, bVal]) => (
                    <div key={label} className="glass-card flex items-center px-4 py-3">
                      <span className="w-24 text-sm font-bold text-zinc-400">{label}</span>
                      <div className="flex-1 text-center text-sm">{aVal || "Not set"}</div>
                      <div className="w-8 text-center">
                        {aVal && bVal && aVal.toLowerCase() === bVal.toLowerCase() ? (
                          <span className="text-xs text-emerald-400">Same</span>
                        ) : (
                          <span className="text-xs text-zinc-500">vs</span>
                        )}
                      </div>
                      <div className="flex-1 text-center text-sm">{bVal || "Not set"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
