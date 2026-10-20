import { combinePassResults, matchSummary, passTotals, type MatchStats } from "@/lib/stats";

export type TrendPoint = {
  id: string;
  label: string;
  value: number;
};

export type TrendMetric =
  | "passes-total"
  | "passes-under-pressure"
  | "passes-not-under-pressure"
  | "passes-accuracy"
  | "pass-results-total"
  | "pass-progressive"
  | "pass-neutral"
  | "pass-lost"
  | "pass-up-total"
  | "pass-up-progressive"
  | "pass-up-neutral"
  | "pass-up-lost"
  | "pass-nop-total"
  | "pass-nop-progressive"
  | "pass-nop-neutral"
  | "pass-nop-lost"
  | "possessions-total"
  | "possessions-retained"
  | "possessions-lost-plays"
  | "possessions-dispossessed"
  | "possessions-wrong-passes"
  | "stats-total-passes"
  | "stats-accuracy"
  | "stats-regains"
  | "stats-interceptions"
  | "stats-recoveries"
  | "stats-offensive-won-rate"
  | "stats-defensive-won-rate"
  | "pass-accurate"
  | "pass-inaccurate"
  | "stats-offensive-won"
  | "stats-offensive-lost"
  | "stats-defensive-won"
  | "stats-defensive-lost";

export type TrendFormat = "count" | "percent";

const TREND_LABEL: Record<TrendMetric, string> = {
  "passes-total": "Total passes",
  "passes-under-pressure": "Under pressure",
  "passes-not-under-pressure": "Not under pressure",
  "passes-accuracy": "Pass accuracy",
  "pass-results-total": "Pass results total",
  "pass-progressive": "Progressive plays",
  "pass-neutral": "Neutral plays",
  "pass-lost": "Lost plays",
  "pass-up-total": "Under pressure passes",
  "pass-up-progressive": "Under pressure · progressive",
  "pass-up-neutral": "Under pressure · neutral",
  "pass-up-lost": "Under pressure · lost",
  "pass-nop-total": "Not under pressure passes",
  "pass-nop-progressive": "Not under pressure · progressive",
  "pass-nop-neutral": "Not under pressure · neutral",
  "pass-nop-lost": "Not under pressure · lost",
  "possessions-total": "Total possessions",
  "possessions-retained": "Retained possessions",
  "possessions-lost-plays": "Lost plays",
  "possessions-dispossessed": "Dispossessed",
  "possessions-wrong-passes": "Wrong passes",
  "stats-total-passes": "Total passes",
  "stats-accuracy": "Pass accuracy",
  "stats-regains": "Regains",
  "stats-interceptions": "Interceptions",
  "stats-recoveries": "Recoveries",
  "stats-offensive-won-rate": "Offensive duels won",
  "stats-defensive-won-rate": "Defensive duels won",
  "pass-accurate": "Accurate passes",
  "pass-inaccurate": "Inaccurate passes",
  "stats-offensive-won": "Offensive duels won",
  "stats-offensive-lost": "Offensive duels lost",
  "stats-defensive-won": "Defensive duels won",
  "stats-defensive-lost": "Defensive duels lost",
};

export function trendFormat(metric: TrendMetric): TrendFormat {
  if (
    metric === "passes-accuracy" ||
    metric === "stats-accuracy" ||
    metric === "stats-offensive-won-rate" ||
    metric === "stats-defensive-won-rate"
  ) {
    return "percent";
  }
  return "count";
}

function rate(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function passBreakdownTotal(match: MatchStats): number {
  const combined = combinePassResults(match.passResults.underPressure, match.passResults.notUnderPressure);
  return combined.progressive + combined.neutral + combined.lost;
}

function breakdownPart(
  match: MatchStats,
  part: "combined" | "underPressure" | "notUnderPressure",
): { progressive: number; neutral: number; lost: number; total: number } {
  const breakdown =
    part === "combined"
      ? combinePassResults(match.passResults.underPressure, match.passResults.notUnderPressure)
      : part === "underPressure"
        ? match.passResults.underPressure
        : match.passResults.notUnderPressure;
  return {
    ...breakdown,
    total: breakdown.progressive + breakdown.neutral + breakdown.lost,
  };
}

function possessionRetained(match: MatchStats): number {
  return Math.max(match.possessions.total - match.possessions.lostPlays, 0);
}

function valueForMatch(match: MatchStats, metric: TrendMetric): number | null {
  switch (metric) {
    case "passes-total":
      return match.passesUnderPressure.total;
    case "passes-under-pressure":
      return match.passesUnderPressure.underPressure;
    case "passes-not-under-pressure":
      return match.passesUnderPressure.notUnderPressure;
    case "passes-accuracy": {
      const passes = passTotals(match);
      return rate(passes.accurate, passes.total);
    }
    case "pass-results-total":
      return passBreakdownTotal(match);
    case "pass-progressive":
      return breakdownPart(match, "combined").progressive;
    case "pass-neutral":
      return breakdownPart(match, "combined").neutral;
    case "pass-lost":
      return breakdownPart(match, "combined").lost;
    case "pass-up-total":
      return breakdownPart(match, "underPressure").total;
    case "pass-up-progressive":
      return breakdownPart(match, "underPressure").progressive;
    case "pass-up-neutral":
      return breakdownPart(match, "underPressure").neutral;
    case "pass-up-lost":
      return breakdownPart(match, "underPressure").lost;
    case "pass-nop-total":
      return breakdownPart(match, "notUnderPressure").total;
    case "pass-nop-progressive":
      return breakdownPart(match, "notUnderPressure").progressive;
    case "pass-nop-neutral":
      return breakdownPart(match, "notUnderPressure").neutral;
    case "pass-nop-lost":
      return breakdownPart(match, "notUnderPressure").lost;
    case "pass-accurate": {
      const passes = passTotals(match);
      return passes.accurate;
    }
    case "pass-inaccurate": {
      const passes = passTotals(match);
      return passes.inaccurate;
    }
    case "possessions-total":
      return match.possessions.total;
    case "possessions-retained":
      return possessionRetained(match);
    case "possessions-lost-plays":
      return match.possessions.lostPlays;
    case "possessions-dispossessed":
      return match.possessions.lostBalls;
    case "possessions-wrong-passes":
      return match.possessions.wrongPasses;
    case "stats-total-passes":
    case "stats-accuracy":
    case "stats-regains":
    case "stats-interceptions":
    case "stats-recoveries":
    case "stats-offensive-won-rate":
    case "stats-defensive-won-rate":
    case "stats-offensive-won":
    case "stats-offensive-lost":
    case "stats-defensive-won":
    case "stats-defensive-lost": {
      const summary = matchSummary(match);
      if (!summary) return null;
      switch (metric) {
        case "stats-total-passes":
          return summary.totalPasses;
        case "stats-accuracy":
          return summary.accuracy;
        case "stats-regains":
          return summary.regains;
        case "stats-interceptions":
          return summary.interceptions;
        case "stats-recoveries":
          return summary.recoveries;
        case "stats-offensive-won-rate":
          return summary.offensiveWinRate;
        case "stats-defensive-won-rate":
          return summary.defensiveWinRate;
        case "stats-offensive-won":
          return summary.offensiveWon;
        case "stats-offensive-lost":
          return summary.offensiveLost;
        case "stats-defensive-won":
          return summary.defensiveWon;
        case "stats-defensive-lost":
          return summary.defensiveLost;
        default:
          return null;
      }
    }
    default:
      return null;
  }
}

export function trendSeries(matches: MatchStats[], metric: TrendMetric): TrendPoint[] {
  return matches.flatMap((match) => {
    const value = valueForMatch(match, metric);
    if (value === null) return [];
    return [{ id: match.id, label: match.shortLabel, value }];
  });
}

export function trendTitle(metric: TrendMetric): string {
  return TREND_LABEL[metric];
}

export function formatTrendValue(value: number, format: TrendFormat): string {
  if (format === "percent") return `${value}%`;
  return String(value);
}
