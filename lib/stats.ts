import gameStats from "@/data/gameStats.json";

export type PassResultBreakdown = {
  progressive: number;
  neutral: number;
  lost: number;
  /** Subset of lost passes that are turnovers. */
  turnovers?: number;
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
    passTurnover?: number;
    duelTurnover?: number;
    videoLink: string;
  };
  videos?: { label: string; url: string }[];
  duels: DuelBlock | null;
  games?: number;
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
  meta: StatsReport["meta"] & { fileSlug: string; games?: number };
  player: StatsReport["player"];
  opponentLogo: string;
  passesUnderPressure: MatchStats["passesUnderPressure"];
  passResults: MatchStats["passResults"];
  possessions: MatchStats["possessions"];
  videos?: { label: string; url: string }[];
  duels: DuelBlock | null;
};

export function getStatsReport(): StatsReport {
  return gameStats as StatsReport;
}

export type MatchSummary = {
  totalPasses: number;
  accurate: number;
  inaccurate: number;
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
      turnovers: (sum.turnovers ?? 0) + (part.turnovers ?? 0),
    }),
    { progressive: 0, neutral: 0, lost: 0 },
  );
}

function rate(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function clipUrl(videos: { label: string; url: string }[] | undefined, ...aliases: string[]): string | undefined {
  if (!videos?.length) return undefined;
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const keys = new Set(aliases.map(normalize));
  return videos.find((video) => keys.has(normalize(video.label)))?.url;
}

/** Average per recorded game, with one decimal when it is not a whole number. */
export function perGame(total: number, games: number): string {
  const value = games > 0 ? total / games : 0;
  const rounded = Math.round(value * 10) / 10;
  return rounded.toFixed(1).replace(/\.0$/, "");
}

export type PassTotals = PassResultBreakdown & {
  accurate: number;
  inaccurate: number;
  total: number;
};

/** Accurate passes are progressive plus neutral. Inaccurate passes are the lost ones. */
export function passTotals(source: { passResults: MatchStats["passResults"] }): PassTotals {
  const combined = combinePassResults(source.passResults.underPressure, source.passResults.notUnderPressure);
  const accurate = combined.progressive + combined.neutral;
  const inaccurate = combined.lost;
  return { ...combined, accurate, inaccurate, total: accurate + inaccurate };
}

export function matchSummary(source: SummarySource): MatchSummary | null {
  if (!source.duels) return null;
  const offensiveWon = source.duels.offensiveWon.actions;
  const offensiveLost = source.duels.offensiveLost.actions;
  const defensiveWon = source.duels.defensiveWon.actions;
  const defensiveLost = source.duels.defensiveLost.actions;
  const interceptions = source.duels.interception.actions;
  const recoveries = source.duels.recovery.actions;
  const passes = passTotals(source);

  return {
    totalPasses: source.passesUnderPressure.total,
    accurate: passes.accurate,
    inaccurate: passes.inaccurate,
    accuracy: rate(passes.accurate, passes.total),
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

function addAction(left: DuelAction, right: DuelAction): DuelAction {
  return {
    actions: left.actions + right.actions,
    good: left.good + right.good,
    bad: left.bad + right.bad,
  };
}

function addDuels(left: DuelBlock, right: DuelBlock): DuelBlock {
  return {
    offensiveWon: addAction(left.offensiveWon, right.offensiveWon),
    offensiveLost: addAction(left.offensiveLost, right.offensiveLost),
    fouled: addAction(left.fouled, right.fouled),
    defensiveWon: addAction(left.defensiveWon, right.defensiveWon),
    defensiveLost: addAction(left.defensiveLost, right.defensiveLost),
    fouls: addAction(left.fouls, right.fouls),
    interception: addAction(left.interception, right.interception),
    recovery: addAction(left.recovery, right.recovery),
  };
}

/** Same match shape as the individual games, with every recorded number added together. */
export function seasonMatch(matches: MatchStats[]): MatchStats {
  const duels = matches.flatMap((match) => (match.duels ? [match.duels] : []));

  return {
    id: "season",
    kind: "session",
    label: "Season",
    shortLabel: "Season",
    logo: "",
    passesUnderPressure: {
      total: matches.reduce((sum, match) => sum + match.passesUnderPressure.total, 0),
      underPressure: matches.reduce((sum, match) => sum + match.passesUnderPressure.underPressure, 0),
      notUnderPressure: matches.reduce((sum, match) => sum + match.passesUnderPressure.notUnderPressure, 0),
      videoLink: "",
    },
    passResults: {
      underPressure: combinePassResults(...matches.map((match) => match.passResults.underPressure)),
      notUnderPressure: combinePassResults(...matches.map((match) => match.passResults.notUnderPressure)),
      videoLink: "",
    },
    possessions: {
      total: matches.reduce((sum, match) => sum + match.possessions.total, 0),
      lostBalls: matches.reduce((sum, match) => sum + match.possessions.lostBalls, 0),
      wrongPasses: matches.reduce((sum, match) => sum + match.possessions.wrongPasses, 0),
      lostPlays: matches.reduce((sum, match) => sum + match.possessions.lostPlays, 0),
      passTurnover: matches.reduce((sum, match) => sum + (match.possessions.passTurnover ?? 0), 0),
      duelTurnover: matches.reduce((sum, match) => sum + (match.possessions.duelTurnover ?? 0), 0),
      videoLink: "",
    },
    duels: duels.length > 0 ? duels.reduce(addDuels) : null,
    games: matches.length,
  };
}

export function toGameStats(report: StatsReport, match: MatchStats): GameStats {
  return {
    meta: {
      ...report.meta,
      subtitle: match.label,
      session: match.kind === "baseline" ? "001" : report.meta.session,
      fileSlug: `${report.meta.session}-${match.id}`,
      games: match.games,
    },
    player: report.player,
    opponentLogo: match.logo,
    passesUnderPressure: match.passesUnderPressure,
    passResults: match.passResults,
    possessions: match.possessions,
    videos: match.videos,
    duels: match.duels,
  };
}
