import gameStats from "@/data/gameStats.json";

export type PassResultBreakdown = {
  progressive: number;
  neutral: number;
  lost: number;
};

export type DuelAction = {
  actions: number;
  good: number;
  bad: number;
};

export type DuelBlock = {
  offensiveWon: DuelAction;
  offensiveLost: DuelAction;
  fouled: DuelAction;
  defensiveWon: DuelAction;
  defensiveLost: DuelAction;
  fouls: DuelAction;
  interception: DuelAction;
  recovery: DuelAction;
};

export type MatchKind = "baseline" | "session";

export type MatchStats = {
  id: string;
  kind: MatchKind;
  label: string;
  shortLabel: string;
  logo: string;
  passesUnderPressure: {
    total: number;
    underPressure: number;
    notUnderPressure: number;
    videoLink: string;
  };
  passResults: {
    underPressure: PassResultBreakdown;
    notUnderPressure: PassResultBreakdown;
    videoLink: string;
  };
  possessions: {
    total: number;
    lostBalls: number;
    wrongPasses: number;
    lostPlays: number;
    videoLink: string;
  };
  duels: DuelBlock | null;
};

export type StatsReport = {
  meta: {
    title: string;
    subtitle: string;
    session: string;
  };
  player: {
    name: string;
    club: string;
    clubLogo: string;
    photo: string;
  };
  matches: MatchStats[];
};

/** Shape consumed by the PDF export of a single match. */
export type GameStats = {
  meta: StatsReport["meta"] & { fileSlug: string };
  player: StatsReport["player"];
  opponentLogo: string;
  passesUnderPressure: MatchStats["passesUnderPressure"];
  passResults: MatchStats["passResults"];
  possessions: MatchStats["possessions"];
  duels: DuelBlock | null;
};

export function getStatsReport(): StatsReport {
  return gameStats as StatsReport;
}

export type MatchSummary = {
  totalPasses: number;
  accuracy: number;
  offensiveWon: number;
  offensiveLost: number;
  offensiveWinRate: number;
  defensiveWon: number;
  defensiveLost: number;
  defensiveWinRate: number;
  interceptions: number;
  recoveries: number;
  regains: number;
};

type SummarySource = {
  passesUnderPressure: MatchStats["passesUnderPressure"];
  passResults: MatchStats["passResults"];
  duels: DuelBlock | null;
};

export function combinePassResults(...parts: PassResultBreakdown[]): PassResultBreakdown {
  return parts.reduce(
    (sum, part) => ({
      progressive: sum.progressive + part.progressive,
      neutral: sum.neutral + part.neutral,
      lost: sum.lost + part.lost,
    }),
    { progressive: 0, neutral: 0, lost: 0 },
  );
}

function rate(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Completed passes (progressive + neutral) as a share of every classified pass. */
export function passAccuracy(source: SummarySource): number {
  const parts = [source.passResults.underPressure, source.passResults.notUnderPressure];
  const completed = parts.reduce((sum, part) => sum + part.progressive + part.neutral, 0);
  const total = parts.reduce((sum, part) => sum + part.progressive + part.neutral + part.lost, 0);
  return rate(completed, total);
}

export function matchSummary(source: SummarySource): MatchSummary | null {
  if (!source.duels) return null;
  const offensiveWon = source.duels.offensiveWon.actions;
  const offensiveLost = source.duels.offensiveLost.actions;
  const defensiveWon = source.duels.defensiveWon.actions;
  const defensiveLost = source.duels.defensiveLost.actions;
  const interceptions = source.duels.interception.actions;
  const recoveries = source.duels.recovery.actions;

  return {
    totalPasses: source.passesUnderPressure.total,
    accuracy: passAccuracy(source),
    offensiveWon,
    offensiveLost,
    offensiveWinRate: rate(offensiveWon, offensiveWon + offensiveLost),
    defensiveWon,
    defensiveLost,
    defensiveWinRate: rate(defensiveWon, defensiveWon + defensiveLost),
    interceptions,
    recoveries,
    regains: interceptions + recoveries,
  };
}

export function toGameStats(report: StatsReport, match: MatchStats): GameStats {
  return {
    meta: {
      ...report.meta,
      subtitle: match.label,
      session: match.kind === "baseline" ? "001" : report.meta.session,
      fileSlug: `${report.meta.session}-${match.id}`,
    },
    player: report.player,
    opponentLogo: match.logo,
    passesUnderPressure: match.passesUnderPressure,
    passResults: match.passResults,
    possessions: match.possessions,
    duels: match.duels,
  };
}
