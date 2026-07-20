import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase config");
  return createClient(supabaseUrl, supabaseKey);
}

const SPORTSDB_URL =
  "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026";

const TEAM_NAME_TO_CODE: Record<string, string> = {
  Mexico: "MEX", "South Africa": "RSA", "South Korea": "KOR", "Czech Republic": "CZE",
  Czechia: "CZE", Canada: "CAN", "Bosnia and Herzegovina": "BIH", "Bosnia & Herzegovina": "BIH",
  Qatar: "QAT", Switzerland: "SUI", Brazil: "BRA", Morocco: "MAR", Haiti: "HAI",
  Scotland: "SCO", "United States": "USA", USA: "USA", Paraguay: "PAR", Australia: "AUS",
  Turkey: "TUR", Germany: "GER", "Curaçao": "CUW", Curacao: "CUW", "Ivory Coast": "CIV",
  "Côte d'Ivoire": "CIV", Ecuador: "ECU", Netherlands: "NED", Japan: "JPN", Sweden: "SWE",
  Tunisia: "TUN", Belgium: "BEL", Egypt: "EGY", Iran: "IRN", "New Zealand": "NZL",
  Spain: "ESP", "Cape Verde": "CPV", "Saudi Arabia": "KSA", Uruguay: "URU", France: "FRA",
  Senegal: "SEN", Iraq: "IRQ", Norway: "NOR", Argentina: "ARG", Algeria: "ALG",
  Austria: "AUT", Jordan: "JOR", Portugal: "POR", "DR Congo": "COD",
  "Congo DR": "COD", "Democratic Republic of the Congo": "COD",
  Uzbekistan: "UZB", Colombia: "COL", England: "ENG", Croatia: "CRO",
  Ghana: "GHA", Panama: "PAN",
};

const GROUP_TEAMS: Record<string, string[]> = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"],
};

interface SportsDBEvent {
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  intRound: string;
  strStatus: string;
  dateEvent: string;
}

function resolveCode(name: string): string | null {
  return TEAM_NAME_TO_CODE[name] || TEAM_NAME_TO_CODE[name.trim()] || null;
}

function findGroup(code: string): string | null {
  for (const [group, teams] of Object.entries(GROUP_TEAMS)) {
    if (teams.includes(code)) return group;
  }
  return null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(SPORTSDB_URL);
    const data = await res.json();
    const events: SportsDBEvent[] = data.events || [];

    const finishedMatches = events.filter(
      (e) => e.intHomeScore !== null && e.intAwayScore !== null
    );

    if (finishedMatches.length === 0) {
      return NextResponse.json({ message: "No finished matches yet", updated: false });
    }

    // Build group standings from finished group-stage matches
    const groupPoints: Record<string, Record<string, { pts: number; gd: number; gf: number }>> = {};

    for (const group of Object.keys(GROUP_TEAMS)) {
      groupPoints[group] = {};
      for (const team of GROUP_TEAMS[group]) {
        groupPoints[group][team] = { pts: 0, gd: 0, gf: 0 };
      }
    }

    for (const match of finishedMatches) {
      const homeCode = resolveCode(match.strHomeTeam);
      const awayCode = resolveCode(match.strAwayTeam);
      if (!homeCode || !awayCode) continue;

      const homeGroup = findGroup(homeCode);
      const awayGroup = findGroup(awayCode);
      if (!homeGroup || homeGroup !== awayGroup) continue;

      const homeGoals = parseInt(match.intHomeScore!);
      const awayGoals = parseInt(match.intAwayScore!);
      if (isNaN(homeGoals) || isNaN(awayGoals)) continue;

      const g = groupPoints[homeGroup];
      g[homeCode].gf += homeGoals;
      g[homeCode].gd += homeGoals - awayGoals;
      g[awayCode].gf += awayGoals;
      g[awayCode].gd += awayGoals - homeGoals;

      if (homeGoals > awayGoals) {
        g[homeCode].pts += 3;
      } else if (homeGoals < awayGoals) {
        g[awayCode].pts += 3;
      } else {
        g[homeCode].pts += 1;
        g[awayCode].pts += 1;
      }
    }

    // Count finished matches per group
    const groupMatchCount: Record<string, number> = {};
    for (const group of Object.keys(GROUP_TEAMS)) {
      groupMatchCount[group] = 0;
    }
    for (const match of finishedMatches) {
      const homeCode = resolveCode(match.strHomeTeam);
      const awayCode = resolveCode(match.strAwayTeam);
      if (!homeCode || !awayCode) continue;
      const homeGroup = findGroup(homeCode);
      const awayGroup = findGroup(awayCode);
      if (!homeGroup || homeGroup !== awayGroup) continue;
      groupMatchCount[homeGroup]++;
    }

    // Sort each group by pts, then gd, then gf — only include groups where all 6 matches are done
    const groupResults: Record<string, string[]> = {};
    for (const [group, teams] of Object.entries(groupPoints)) {
      if (groupMatchCount[group] < 6) continue; // 4 teams = 6 matches per group
      const sorted = Object.entries(teams)
        .sort(([, a], [, b]) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
        .map(([code]) => code);
      groupResults[group] = sorted;
    }

    // Process knockout matches
    const knockoutResults: Record<string, string> = {};
    const R32_MATCH_SEEDS: Record<number, [string, string]> = {
      73: ["2A", "2B"], 74: ["1E", "3rd"], 75: ["1F", "2C"], 76: ["1C", "2F"],
      77: ["1I", "3rd"], 78: ["2E", "2I"], 79: ["1A", "3rd"], 80: ["1L", "3rd"],
      81: ["1D", "3rd"], 82: ["1G", "3rd"], 83: ["2K", "2L"], 84: ["1H", "2J"],
      85: ["1B", "3rd"], 86: ["1J", "2H"], 87: ["1K", "3rd"], 88: ["2D", "2G"],
    };
    const R32_NUM_TO_ID: Record<number, string> = {
      73: "r32_1", 74: "r32_2", 75: "r32_3", 76: "r32_4",
      77: "r32_5", 78: "r32_6", 79: "r32_7", 80: "r32_8",
      81: "r32_9", 82: "r32_10", 83: "r32_11", 84: "r32_12",
      85: "r32_13", 86: "r32_14", 87: "r32_15", 88: "r32_16",
    };
    const R16_NUM_TO_ID: Record<number, string> = {
      89: "r16_1", 90: "r16_2", 91: "r16_3", 92: "r16_4",
      93: "r16_5", 94: "r16_6", 95: "r16_7", 96: "r16_8",
    };
    const QF_NUM_TO_ID: Record<number, string> = {
      97: "qf_1", 98: "qf_2", 99: "qf_3", 100: "qf_4",
    };
    const SF_NUM_TO_ID: Record<number, string> = { 101: "sf_1", 102: "sf_2" };

    const allKoMaps: Record<number, string> = { ...R32_NUM_TO_ID, ...R16_NUM_TO_ID, ...QF_NUM_TO_ID, ...SF_NUM_TO_ID, 104: "final" };

    for (const match of finishedMatches) {
      const roundStr = match.intRound;
      const matchNum = parseInt(roundStr);
      if (isNaN(matchNum) || matchNum < 73) continue;

      const matchId = allKoMaps[matchNum];
      if (!matchId) continue;

      const homeCode = resolveCode(match.strHomeTeam);
      const awayCode = resolveCode(match.strAwayTeam);
      if (!homeCode || !awayCode) continue;

      const homeGoals = parseInt(match.intHomeScore!);
      const awayGoals = parseInt(match.intAwayScore!);
      if (isNaN(homeGoals) || isNaN(awayGoals)) continue;

      const winner = homeGoals >= awayGoals ? homeCode : awayCode;
      knockoutResults[matchId] = winner;
    }

    // Determine tournament winner from final
    let tournamentWinner = "";
    if (knockoutResults["final"]) {
      tournamentWinner = knockoutResults["final"];
    }

    // Merge with existing results so manual entries aren't overwritten
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from("actual_results")
      .select("group_results, knockout_results, tournament_winner")
      .eq("id", 1)
      .single();

    const mergedGroups = { ...(existing?.group_results || {}), ...groupResults };
    const mergedKnockout = { ...(existing?.knockout_results || {}), ...knockoutResults };

    await supabase
      .from("actual_results")
      .update({
        group_results: mergedGroups,
        knockout_results: mergedKnockout,
        tournament_winner: tournamentWinner || existing?.tournament_winner || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    return NextResponse.json({
      message: "Results updated",
      updated: true,
      finishedMatches: finishedMatches.length,
      groupsWithResults: Object.keys(groupResults).filter(
        (g) => groupResults[g].some((_, i, arr) => {
          const stats = groupPoints[g][arr[i]];
          return stats.pts > 0 || stats.gf > 0;
        })
      ).length,
      knockoutResults: Object.keys(knockoutResults).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch results", details: String(error) },
      { status: 500 }
    );
  }
}
