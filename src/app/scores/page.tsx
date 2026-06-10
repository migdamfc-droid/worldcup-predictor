"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { GROUPS, ALL_TEAMS } from "@/lib/teams";
import { SkeletonCard } from "@/components/Skeleton";

interface Match {
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
  dateEvent: string;
  strTimestamp: string;
}

const TEAM_NAME_TO_CODE: Record<string, string> = {
  Mexico: "MEX", "South Africa": "RSA", "South Korea": "KOR", "Czech Republic": "CZE",
  Czechia: "CZE", Canada: "CAN", "Bosnia and Herzegovina": "BIH", "Bosnia & Herzegovina": "BIH",
  Qatar: "QAT", Switzerland: "SUI", Brazil: "BRA", Morocco: "MAR", Haiti: "HAI",
  Scotland: "SCO", "United States": "USA", USA: "USA", Paraguay: "PAR", Australia: "AUS",
  Turkey: "TUR", Germany: "GER", "Curaçao": "CUW", Curacao: "CUW", "Ivory Coast": "CIV",
  Ecuador: "ECU", Netherlands: "NED", Japan: "JPN", Sweden: "SWE", Tunisia: "TUN",
  Belgium: "BEL", Egypt: "EGY", Iran: "IRN", "New Zealand": "NZL", Spain: "ESP",
  "Cape Verde": "CPV", "Saudi Arabia": "KSA", Uruguay: "URU", France: "FRA",
  Senegal: "SEN", Iraq: "IRQ", Norway: "NOR", Argentina: "ARG", Algeria: "ALG",
  Austria: "AUT", Jordan: "JOR", Portugal: "POR", "DR Congo": "COD",
  Uzbekistan: "UZB", Colombia: "COL", England: "ENG", Croatia: "CRO",
  Ghana: "GHA", Panama: "PAN",
};

function getTeamDisplay(name: string) {
  const code = TEAM_NAME_TO_CODE[name] || TEAM_NAME_TO_CODE[name?.trim()];
  const team = code ? ALL_TEAMS.find((t) => t.code === code) : null;
  return { name: team?.name || name, flag: team?.flag || "", code };
}

function findGroup(code: string): string | null {
  for (const g of GROUPS) {
    if (g.teams.some((t) => t.code === code)) return g.name;
  }
  return null;
}

export default function ScoresPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026")
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const finished = matches.filter((m) => m.intHomeScore !== null && m.intAwayScore !== null);
  const upcoming = matches.filter((m) => m.intHomeScore === null).sort((a, b) => a.dateEvent.localeCompare(b.dateEvent));

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold">Live Scores</h1>
        <p className="mb-8 text-sm text-zinc-500">Match results update automatically.</p>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
        ) : matches.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-zinc-500">No match data available yet. Check back once the tournament begins.</p>
          </div>
        ) : (
          <>
            {finished.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-lg font-semibold">Results</h2>
                <div className="space-y-2">
                  {finished.slice().reverse().map((m, i) => {
                    const home = getTeamDisplay(m.strHomeTeam);
                    const away = getTeamDisplay(m.strAwayTeam);
                    const group = home.code ? findGroup(home.code) : null;
                    return (
                      <div key={i} className="glass-card flex items-center gap-3 px-4 py-3">
                        {group && <span className="text-xs text-zinc-500 w-8">Grp {group}</span>}
                        <div className="flex flex-1 items-center justify-end gap-2 text-right">
                          <span className="text-sm font-medium truncate">{home.name}</span>
                          <span className="text-lg">{home.flag}</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 px-3 py-1">
                          <span className="text-lg font-bold tabular-nums">{m.intHomeScore}</span>
                          <span className="text-zinc-500">-</span>
                          <span className="text-lg font-bold tabular-nums">{m.intAwayScore}</span>
                        </div>
                        <div className="flex flex-1 items-center gap-2">
                          <span className="text-lg">{away.flag}</span>
                          <span className="text-sm font-medium truncate">{away.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">Upcoming</h2>
                <div className="space-y-2">
                  {upcoming.slice(0, 20).map((m, i) => {
                    const home = getTeamDisplay(m.strHomeTeam);
                    const away = getTeamDisplay(m.strAwayTeam);
                    const group = home.code ? findGroup(home.code) : null;
                    const date = new Date(m.dateEvent + "T00:00:00Z");
                    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    return (
                      <div key={i} className="glass-card flex items-center gap-3 px-4 py-3 opacity-70">
                        {group && <span className="text-xs text-zinc-500 w-8">Grp {group}</span>}
                        <div className="flex flex-1 items-center justify-end gap-2 text-right">
                          <span className="text-sm font-medium truncate">{home.name}</span>
                          <span className="text-lg">{home.flag}</span>
                        </div>
                        <div className="flex items-center rounded-lg bg-zinc-200 dark:bg-zinc-800 px-3 py-1">
                          <span className="text-xs text-zinc-400">{dateStr}</span>
                        </div>
                        <div className="flex flex-1 items-center gap-2">
                          <span className="text-lg">{away.flag}</span>
                          <span className="text-sm font-medium truncate">{away.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
