export interface Team {
  name: string;
  code: string;
  flag: string;
}

export interface Group {
  name: string;
  teams: Team[];
}

const t = (name: string, code: string, flag: string): Team => ({ name, code, flag });

export const GROUPS: Group[] = [
  { name: "A", teams: [t("Mexico", "MEX", "🇲🇽"), t("South Africa", "RSA", "🇿🇦"), t("South Korea", "KOR", "🇰🇷"), t("Czech Republic", "CZE", "🇨🇿")] },
  { name: "B", teams: [t("Canada", "CAN", "🇨🇦"), t("Bosnia & Herzegovina", "BIH", "🇧🇦"), t("Qatar", "QAT", "🇶🇦"), t("Switzerland", "SUI", "🇨🇭")] },
  { name: "C", teams: [t("Brazil", "BRA", "🇧🇷"), t("Morocco", "MAR", "🇲🇦"), t("Haiti", "HAI", "🇭🇹"), t("Scotland", "SCO", "🏴󠁧󠁢󠁳󠁣󠁴󠁿")] },
  { name: "D", teams: [t("United States", "USA", "🇺🇸"), t("Paraguay", "PAR", "🇵🇾"), t("Australia", "AUS", "🇦🇺"), t("Turkey", "TUR", "🇹🇷")] },
  { name: "E", teams: [t("Germany", "GER", "🇩🇪"), t("Curaçao", "CUW", "🇨🇼"), t("Ivory Coast", "CIV", "🇨🇮"), t("Ecuador", "ECU", "🇪🇨")] },
  { name: "F", teams: [t("Netherlands", "NED", "🇳🇱"), t("Japan", "JPN", "🇯🇵"), t("Sweden", "SWE", "🇸🇪"), t("Tunisia", "TUN", "🇹🇳")] },
  { name: "G", teams: [t("Belgium", "BEL", "🇧🇪"), t("Egypt", "EGY", "🇪🇬"), t("Iran", "IRN", "🇮🇷"), t("New Zealand", "NZL", "🇳🇿")] },
  { name: "H", teams: [t("Spain", "ESP", "🇪🇸"), t("Cape Verde", "CPV", "🇨🇻"), t("Saudi Arabia", "KSA", "🇸🇦"), t("Uruguay", "URU", "🇺🇾")] },
  { name: "I", teams: [t("France", "FRA", "🇫🇷"), t("Senegal", "SEN", "🇸🇳"), t("Iraq", "IRQ", "🇮🇶"), t("Norway", "NOR", "🇳🇴")] },
  { name: "J", teams: [t("Argentina", "ARG", "🇦🇷"), t("Algeria", "ALG", "🇩🇿"), t("Austria", "AUT", "🇦🇹"), t("Jordan", "JOR", "🇯🇴")] },
  { name: "K", teams: [t("Portugal", "POR", "🇵🇹"), t("DR Congo", "COD", "🇨🇩"), t("Uzbekistan", "UZB", "🇺🇿"), t("Colombia", "COL", "🇨🇴")] },
  { name: "L", teams: [t("England", "ENG", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"), t("Croatia", "CRO", "🇭🇷"), t("Ghana", "GHA", "🇬🇭"), t("Panama", "PAN", "🇵🇦")] },
];

export const ALL_TEAMS = GROUPS.flatMap(g => g.teams);

export interface KnockoutMatch {
  id: string;
  round: string;
  matchNum: number;
  seedA: string;
  seedB: string;
  feedsInto?: string;
  feedsSlot?: "A" | "B";
}

export const KNOCKOUT_STRUCTURE: KnockoutMatch[] = [
  // Round of 32 — match numbers follow FIFA (73-88)
  // Left bracket (feeds SF1)
  { id: "r32_1", round: "R32", matchNum: 1, seedA: "2A", seedB: "2B", feedsInto: "r16_2", feedsSlot: "A" },
  { id: "r32_2", round: "R32", matchNum: 2, seedA: "1E", seedB: "3rd_0", feedsInto: "r16_1", feedsSlot: "A" },
  { id: "r32_3", round: "R32", matchNum: 3, seedA: "1F", seedB: "2C", feedsInto: "r16_2", feedsSlot: "B" },
  { id: "r32_4", round: "R32", matchNum: 4, seedA: "1C", seedB: "2F", feedsInto: "r16_3", feedsSlot: "A" },
  { id: "r32_5", round: "R32", matchNum: 5, seedA: "1I", seedB: "3rd_1", feedsInto: "r16_1", feedsSlot: "B" },
  { id: "r32_6", round: "R32", matchNum: 6, seedA: "2E", seedB: "2I", feedsInto: "r16_3", feedsSlot: "B" },
  { id: "r32_7", round: "R32", matchNum: 7, seedA: "1A", seedB: "3rd_2", feedsInto: "r16_4", feedsSlot: "A" },
  { id: "r32_8", round: "R32", matchNum: 8, seedA: "1L", seedB: "3rd_3", feedsInto: "r16_4", feedsSlot: "B" },
  // Right bracket (feeds SF2)
  { id: "r32_9", round: "R32", matchNum: 9, seedA: "1D", seedB: "3rd_4", feedsInto: "r16_6", feedsSlot: "A" },
  { id: "r32_10", round: "R32", matchNum: 10, seedA: "1G", seedB: "3rd_5", feedsInto: "r16_6", feedsSlot: "B" },
  { id: "r32_11", round: "R32", matchNum: 11, seedA: "2K", seedB: "2L", feedsInto: "r16_5", feedsSlot: "A" },
  { id: "r32_12", round: "R32", matchNum: 12, seedA: "1H", seedB: "2J", feedsInto: "r16_5", feedsSlot: "B" },
  { id: "r32_13", round: "R32", matchNum: 13, seedA: "1B", seedB: "3rd_6", feedsInto: "r16_8", feedsSlot: "A" },
  { id: "r32_14", round: "R32", matchNum: 14, seedA: "1J", seedB: "2H", feedsInto: "r16_7", feedsSlot: "A" },
  { id: "r32_15", round: "R32", matchNum: 15, seedA: "1K", seedB: "3rd_7", feedsInto: "r16_8", feedsSlot: "B" },
  { id: "r32_16", round: "R32", matchNum: 16, seedA: "2D", seedB: "2G", feedsInto: "r16_7", feedsSlot: "B" },
  // Round of 16 — FIFA matches 89-96
  { id: "r16_1", round: "R16", matchNum: 1, seedA: "W r32_2", seedB: "W r32_5", feedsInto: "qf_1", feedsSlot: "A" },
  { id: "r16_2", round: "R16", matchNum: 2, seedA: "W r32_1", seedB: "W r32_3", feedsInto: "qf_1", feedsSlot: "B" },
  { id: "r16_3", round: "R16", matchNum: 3, seedA: "W r32_4", seedB: "W r32_6", feedsInto: "qf_3", feedsSlot: "A" },
  { id: "r16_4", round: "R16", matchNum: 4, seedA: "W r32_7", seedB: "W r32_8", feedsInto: "qf_3", feedsSlot: "B" },
  { id: "r16_5", round: "R16", matchNum: 5, seedA: "W r32_11", seedB: "W r32_12", feedsInto: "qf_2", feedsSlot: "A" },
  { id: "r16_6", round: "R16", matchNum: 6, seedA: "W r32_9", seedB: "W r32_10", feedsInto: "qf_2", feedsSlot: "B" },
  { id: "r16_7", round: "R16", matchNum: 7, seedA: "W r32_14", seedB: "W r32_16", feedsInto: "qf_4", feedsSlot: "A" },
  { id: "r16_8", round: "R16", matchNum: 8, seedA: "W r32_13", seedB: "W r32_15", feedsInto: "qf_4", feedsSlot: "B" },
  // Quarter-finals — FIFA matches 97-100
  { id: "qf_1", round: "QF", matchNum: 1, seedA: "W r16_1", seedB: "W r16_2", feedsInto: "sf_1", feedsSlot: "A" },
  { id: "qf_2", round: "QF", matchNum: 2, seedA: "W r16_5", seedB: "W r16_6", feedsInto: "sf_1", feedsSlot: "B" },
  { id: "qf_3", round: "QF", matchNum: 3, seedA: "W r16_3", seedB: "W r16_4", feedsInto: "sf_2", feedsSlot: "A" },
  { id: "qf_4", round: "QF", matchNum: 4, seedA: "W r16_7", seedB: "W r16_8", feedsInto: "sf_2", feedsSlot: "B" },
  // Semi-finals
  { id: "sf_1", round: "SF", matchNum: 1, seedA: "W qf_1", seedB: "W qf_2", feedsInto: "final", feedsSlot: "A" },
  { id: "sf_2", round: "SF", matchNum: 2, seedA: "W qf_3", seedB: "W qf_4", feedsInto: "final", feedsSlot: "B" },
  // Final
  { id: "final", round: "Final", matchNum: 1, seedA: "W sf_1", seedB: "W sf_2" },
];

export const ROUNDS = ["R32", "R16", "QF", "SF", "Final"] as const;

export function getTeamByCode(code: string): Team | undefined {
  return ALL_TEAMS.find(t => t.code === code);
}
