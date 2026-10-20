"use client";

import { useMemo, useState } from "react";
import { AthleteProfileCard } from "@/components/AthleteProfileCard";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { VideoLinksProvider } from "@/components/VideoLinksContext";
import { MetricFlow } from "@/components/MetricFlow";
import { SgaBrand } from "@/components/SgaBrand";
import { SgaCornerBrand } from "@/components/SgaCornerBrand";
import { PossessionBoard, StatsHeroSideboard } from "@/components/ChicagoExploreViews";
import { PerGameBadge } from "@/components/PerGameBadge";
import { TopicsBoard, type Topic } from "@/components/TopicsBoard";
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
          <strong>
            {primary} · {percent(primary, total)}%
          </strong>
        </li>
        <li>
          <span className={`legend__dot legend__dot--${secondaryTone}`} />
          <span className="legend__label">{secondaryLabel}</span>
          <strong>
            {secondary} · {percent(secondary, total)}%
          </strong>
        </li>
      </ul>
    </div>
  );
}

function PassResultsMeter({
  title,
  breakdown,
  games,
}: {
  title: string;
  breakdown: PassResultBreakdown;
  games?: number;
}) {
  const total = breakdown.progressive + breakdown.neutral + breakdown.lost;
  const progressivePct = percent(breakdown.progressive, total);
  const neutralPct = percent(breakdown.neutral, total);
  const lostPct = percent(breakdown.lost, total);

  return (
    <div className="metric-card">
      <h3 className="metric-card__title">{title}</h3>
      <p className="metric-card__headline metric-card__headline--stack">
        <span>{total} passes</span>
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
          <strong>
            {breakdown.progressive} · {progressivePct}%
          </strong>
        </li>
        <li>
          <span className="legend__dot legend__dot--pass-neutral" />
          <PassPlayTip label="Neutral plays" tip={PASS_PLAY_TIPS.neutral} />
          <strong>
            {breakdown.neutral} · {neutralPct}%
          </strong>
        </li>
        <li>
          <span className="legend__dot legend__dot--pass-lost" />
          <PassPlayTip label="Lost plays" tip={PASS_PLAY_TIPS.lost} />
          <strong>
            {breakdown.lost} · {lostPct}%
          </strong>
        </li>
      </ul>
    </div>
  );
}

function TotalFigure({ value, games }: { value: number; games?: number }) {
  return (
    <span className="metric-total metric-total--stack">
      <span className="metric-card__value">{value}</span>
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

function buildTopics(match: MatchStats): Topic[] {
  const { passesUnderPressure, passResults, possessions, games } = match;
  const scope = match.id === "season" ? "season" : "match";

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
              <TotalFigure value={passesUnderPressure.total} games={games} />
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
          />
          <MetricFlow
            items={[
              <PassResultsMeter key="up" title="Under pressure" breakdown={passResults.underPressure} />,
              <PassResultsMeter key="nop" title="Not under pressure" breakdown={passResults.notUnderPressure} />,
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
        <PossessionBoard
          possessions={possessions}
          scopeLabel={scope}
          totalFigure={<TotalFigure value={possessions.total} games={games} />}
        />
      ),
    },
  ];

  const summary = matchSummary(match);
  if (summary) {
    topics.push({
      id: "stats",
      title: "Stats",
      phase: "stats",
      content: <StatsHeroSideboard summary={summary} games={games} />,
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
  const topics = useMemo(() => buildTopics(match), [match]);

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
