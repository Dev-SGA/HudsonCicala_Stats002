"use client";

import { useMemo, useState } from "react";
import { AthleteProfileCard } from "@/components/AthleteProfileCard";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { VideoLinksProvider } from "@/components/VideoLinksContext";
import { MetricFlow } from "@/components/MetricFlow";
import { SgaBrand } from "@/components/SgaBrand";
import { SgaCornerBrand } from "@/components/SgaCornerBrand";
import { PossessionSplitView, StatsHeroSideboard } from "@/components/ChicagoExploreViews";
import { MatchTrendTip } from "@/components/MatchTrendTip";
import { PerGameBadge } from "@/components/PerGameBadge";
import { TopicsBoard, type Topic } from "@/components/TopicsBoard";
import type { TrendMetric } from "@/lib/matchTrends";
import { BRAND } from "@/lib/brand";
import {
  combinePassResults,
  matchSummary,
  seasonMatch,
  toGameStats,
  type GameStats,
  type MatchStats,
  type PassResultBreakdown,
  type StatsReport,
} from "@/lib/stats";

type GameStatsReportProps = {
  report: StatsReport;
};

type BarTone = "accent" | "positive" | "negative" | "muted" | "warn";

type TrendContext = {
  matches: MatchStats[];
  activeMatchId: string;
};

const PASS_PLAY_TIPS = {
  progressive:
    "Progressive Play — Finding a teammate with a clear opportunity to progress the ball, create a scoring opportunity, or a pass that break defensive lines.",
  neutral:
    "Neutral Play — Finding a teammate without a clear opportunity to progress the ball, but with a clear option to maintain possession.",
  lost: "Lost Play — Losing possession through an inaccurate pass or finding a teammate who is immediately under pressure and at high risk of losing possession.",
} as const;

function PassPlayTip({ label, tip }: { label: string; tip: string }) {
  return (
    <button type="button" className="pass-play-tip legend__label" data-tip={tip} aria-label={`${label}. ${tip}`}>
      <span className="pass-play-tip__label">{label}</span>
    </button>
  );
}

function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function SplitMeter({
  title,
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  primaryTone,
  secondaryTone,
  headline,
  major,
  primaryMetric,
  secondaryMetric,
  trend,
}: {
  title: string;
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryTone: BarTone;
  secondaryTone: BarTone;
  headline: string;
  major?: boolean;
  primaryMetric: TrendMetric;
  secondaryMetric: TrendMetric;
  trend: TrendContext;
}) {
  const total = primary + secondary;
  const primaryPct = percent(primary, total);

  return (
    <div className={`metric-card${major ? " metric-card--major" : " metric-card--compact"}`}>
      <h3 className="metric-card__title">{title}</h3>
      <p className="metric-card__headline">{headline}</p>
      <div className="meter" role="img" aria-label={`${primaryLabel}: ${primary}. ${secondaryLabel}: ${secondary}.`}>
        <span className={`meter__seg meter__seg--${primaryTone}`} style={{ width: `${primaryPct}%` }} />
        <span className={`meter__seg meter__seg--${secondaryTone}`} style={{ width: `${100 - primaryPct}%` }} />
      </div>
      <ul className="legend">
        <li>
          <span className={`legend__dot legend__dot--${primaryTone}`} />
          <span className="legend__label">{primaryLabel}</span>
          <MatchTrendTip metric={primaryMetric} matches={trend.matches} activeMatchId={trend.activeMatchId}>
            <strong>
              {primary} · {percent(primary, total)}%
            </strong>
          </MatchTrendTip>
        </li>
        <li>
          <span className={`legend__dot legend__dot--${secondaryTone}`} />
          <span className="legend__label">{secondaryLabel}</span>
          <MatchTrendTip metric={secondaryMetric} matches={trend.matches} activeMatchId={trend.activeMatchId}>
            <strong>
              {secondary} · {percent(secondary, total)}%
            </strong>
          </MatchTrendTip>
        </li>
      </ul>
    </div>
  );
}

type PassResultsTrendScope = "combined" | "underPressure" | "notUnderPressure";

const PASS_RESULTS_TREND: Record<
  PassResultsTrendScope,
  { total: TrendMetric; progressive: TrendMetric; neutral: TrendMetric; lost: TrendMetric }
> = {
  combined: {
    total: "pass-results-total",
    progressive: "pass-progressive",
    neutral: "pass-neutral",
    lost: "pass-lost",
  },
  underPressure: {
    total: "pass-up-total",
    progressive: "pass-up-progressive",
    neutral: "pass-up-neutral",
    lost: "pass-up-lost",
  },
  notUnderPressure: {
    total: "pass-nop-total",
    progressive: "pass-nop-progressive",
    neutral: "pass-nop-neutral",
    lost: "pass-nop-lost",
  },
};

function PassResultsMeter({
  title,
  breakdown,
  games,
  trendScope,
  trend,
}: {
  title: string;
  breakdown: PassResultBreakdown;
  games?: number;
  trendScope: PassResultsTrendScope;
  trend: TrendContext;
}) {
  const trendMetrics = PASS_RESULTS_TREND[trendScope];
  const total = breakdown.progressive + breakdown.neutral + breakdown.lost;
  const progressivePct = percent(breakdown.progressive, total);
  const neutralPct = percent(breakdown.neutral, total);
  const lostPct = percent(breakdown.lost, total);

  return (
    <div className="metric-card">
      <h3 className="metric-card__title">{title}</h3>
      <p className="metric-card__headline metric-card__headline--stack">
        <MatchTrendTip metric={trendMetrics.total} matches={trend.matches} activeMatchId={trend.activeMatchId}>
          <span>{total} passes</span>
        </MatchTrendTip>
        {games ? <PerGameBadge total={total} games={games} className="per-game-badge--inline" /> : null}
      </p>
      <div
        className="meter"
        role="img"
        aria-label={`Progressive: ${breakdown.progressive}. Neutral: ${breakdown.neutral}. Lost: ${breakdown.lost}.`}
      >
        <span className="meter__seg meter__seg--pass-progressive" style={{ width: `${progressivePct}%` }} />
        <span className="meter__seg meter__seg--pass-neutral" style={{ width: `${neutralPct}%` }} />
        <span className="meter__seg meter__seg--pass-lost" style={{ width: `${lostPct}%` }} />
      </div>
      <ul className="legend">
        <li>
          <span className="legend__dot legend__dot--pass-progressive" />
          <PassPlayTip label="Progressive plays" tip={PASS_PLAY_TIPS.progressive} />
          <MatchTrendTip metric={trendMetrics.progressive} matches={trend.matches} activeMatchId={trend.activeMatchId}>
            <strong>
              {breakdown.progressive} · {progressivePct}%
            </strong>
          </MatchTrendTip>
        </li>
        <li>
          <span className="legend__dot legend__dot--pass-neutral" />
          <PassPlayTip label="Neutral plays" tip={PASS_PLAY_TIPS.neutral} />
          <MatchTrendTip metric={trendMetrics.neutral} matches={trend.matches} activeMatchId={trend.activeMatchId}>
            <strong>
              {breakdown.neutral} · {neutralPct}%
            </strong>
          </MatchTrendTip>
        </li>
        <li>
          <span className="legend__dot legend__dot--pass-lost" />
          <PassPlayTip label="Lost plays" tip={PASS_PLAY_TIPS.lost} />
          <MatchTrendTip metric={trendMetrics.lost} matches={trend.matches} activeMatchId={trend.activeMatchId}>
            <strong>
              {breakdown.lost} · {lostPct}%
            </strong>
          </MatchTrendTip>
        </li>
      </ul>
    </div>
  );
}

function TotalFigure({
  value,
  games,
  metric,
  trend,
}: {
  value: number;
  games?: number;
  metric: TrendMetric;
  trend: TrendContext;
}) {
  return (
    <span className="metric-total metric-total--stack">
      <MatchTrendTip metric={metric} matches={trend.matches} activeMatchId={trend.activeMatchId}>
        <span className="metric-card__value">{value}</span>
      </MatchTrendTip>
      {games ? <PerGameBadge total={value} games={games} /> : null}
    </span>
  );
}

function MatchSwitcher({
  matches,
  activeId,
  onChange,
}: {
  matches: MatchStats[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  const index = matches.findIndex((match) => match.id === activeId);

  return (
    <div className="match-nav">
      <div className="match-nav__session" role="group" aria-label="Matches">
        <button
          type="button"
          className="match-nav__arrow"
          onClick={() => onChange(matches[index - 1].id)}
          disabled={index <= 0}
          aria-label="Previous match"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="match-nav__pills">
          {matches.map((match) => (
            <button
              key={match.id}
              type="button"
              className={`match-nav__pill${match.id === activeId ? " is-active" : ""}`}
              aria-pressed={match.id === activeId}
              onClick={() => onChange(match.id)}
            >
              {match.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.logo} alt="" className="club-logo club-logo--pill" />
              ) : null}
              {match.shortLabel}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="match-nav__arrow"
          onClick={() => onChange(matches[index + 1].id)}
          disabled={index < 0 || index === matches.length - 1}
          aria-label="Next match"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}

function buildTopics(match: MatchStats, sessionMatches: MatchStats[]): Topic[] {
  const { passesUnderPressure, passResults, possessions, games } = match;
  const scope = match.id === "season" ? "season" : "match";
  const trend: TrendContext = { matches: sessionMatches, activeMatchId: match.id };

  const topics: Topic[] = [
    {
      id: "passes-pressure",
      title: "Passes Under Pressure vs Not",
      phase: "build-up",
      content: (
        <MetricFlow
          className="metric-flow--pressure"
          items={[
            <div key="total" className="metric-card metric-card--hero metric-card--compact">
              <h3 className="metric-card__title">Total passes</h3>
              <TotalFigure
                value={passesUnderPressure.total}
                games={games}
                metric="passes-total"
                trend={trend}
              />
              <p className="metric-card__caption">Passes tracked in the {scope}</p>
            </div>,
            <SplitMeter
              key="split"
              title="Pressure context"
              headline={`${passesUnderPressure.underPressure} under pressure · ${passesUnderPressure.notUnderPressure} not under pressure`}
              primary={passesUnderPressure.underPressure}
              secondary={passesUnderPressure.notUnderPressure}
              primaryLabel="Under pressure"
              secondaryLabel="Not under pressure"
              primaryTone="warn"
              secondaryTone="accent"
              primaryMetric="passes-under-pressure"
              secondaryMetric="passes-not-under-pressure"
              trend={trend}
              major
            />,
          ]}
        />
      ),
    },
    {
      id: "pass-results",
      title: "Pass Results",
      phase: "build-up",
      content: (
        <>
          <PassResultsMeter
            title="Total passes"
            breakdown={combinePassResults(passResults.underPressure, passResults.notUnderPressure)}
            games={games}
            trendScope="combined"
            trend={trend}
          />
          <MetricFlow
            items={[
              <PassResultsMeter
                key="up"
                title="Under pressure"
                breakdown={passResults.underPressure}
                trendScope="underPressure"
                trend={trend}
              />,
              <PassResultsMeter
                key="nop"
                title="Not under pressure"
                breakdown={passResults.notUnderPressure}
                trendScope="notUnderPressure"
                trend={trend}
              />,
            ]}
          />
        </>
      ),
    },
    {
      id: "possessions",
      title: "Possessions",
      phase: "build-up",
      content: (
        <>
          <div className="metric-card metric-card--hero metric-card--compact">
            <h3 className="metric-card__title">Total possessions</h3>
            <TotalFigure value={possessions.total} games={games} metric="possessions-total" trend={trend} />
            <p className="metric-card__caption">Ball possessions in the {scope}</p>
          </div>
          <PossessionSplitView possessions={possessions} trend={trend} scopeLabel={scope} />
        </>
      ),
    },
  ];

  const summary = matchSummary(match);
  if (summary) {
    topics.push({
      id: "stats",
      title: "Stats",
      phase: "stats",
      content: <StatsHeroSideboard summary={summary} games={games} trend={trend} />,
    });
  }

  return topics;
}

export function GameStatsReport({ report }: GameStatsReportProps) {
  const { player, meta, matches } = report;
  const options = useMemo(() => [...matches, seasonMatch(matches)], [matches]);
  const initialMatchId = matches.find((match) => match.kind === "session")?.id ?? matches[0]?.id ?? "";
  const [matchId, setMatchId] = useState(initialMatchId);
  const match = options.find((item) => item.id === matchId) ?? options[0];
  const exportStats: GameStats = useMemo(() => toGameStats(report, match), [report, match]);
  const topics = useMemo(() => buildTopics(match, matches), [match, matches]);

  return (
    <VideoLinksProvider
      initialPassesUnderPressureVideoLink={match.passesUnderPressure.videoLink}
      initialPassResultsVideoLink={match.passResults.videoLink}
      initialPossessionsVideoLink={match.possessions.videoLink}
    >
      <SgaCornerBrand />

      <div className="shell">
        <header className="report-header">
          <SgaBrand />
          <div className="report-header__intro">
            <p className="report-header__eyebrow">{BRAND.legal}</p>
            <h1 className="report-header__title">{meta.title}</h1>
            <p className="report-header__meta">
              {match.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.logo} alt="" className="club-logo club-logo--meta" />
              ) : null}
              {match.label}
            </p>
          </div>
        </header>

        <div className="report-grid">
          <AthleteProfileCard name={player.name} club={player.club} clubLogo={player.clubLogo} photoSrc={player.photo}>
            <ExportPdfButton stats={exportStats} />
          </AthleteProfileCard>

          <main className="report-main">
            <div className="view-panel">
              <MatchSwitcher matches={options} activeId={match.id} onChange={setMatchId} />
              <TopicsBoard topics={topics} />
            </div>
          </main>
        </div>

        <footer className="footer">
          <p className="footer__slogan">{BRAND.slogan}</p>
          <p className="footer__rights">All rights reserved.</p>
        </footer>
      </div>
    </VideoLinksProvider>
  );
}
