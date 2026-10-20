"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AthleteProfileCard } from "@/components/AthleteProfileCard";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { VideoLinksProvider } from "@/components/VideoLinksContext";
import { MetricFlow } from "@/components/MetricFlow";
import { SgaBrand } from "@/components/SgaBrand";
import { SgaCornerBrand } from "@/components/SgaCornerBrand";
import {
  type ChicagoExploreView,
  PossessionShareView,
  PossessionSplitView,
  StatsColumnBoard,
  StatsHeroSideboard,
} from "@/components/ChicagoExploreViews";
import { TopicsBoard, type Topic } from "@/components/TopicsBoard";
import { BRAND } from "@/lib/brand";
import {
  combinePassResults,
  matchSummary,
  perGame,
  seasonMatch,
  toGameStats,
  type GameStats,
  type MatchStats,
  type MatchSummary,
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
      <p className="metric-card__headline">
        <span>{total} passes</span>
        {games ? <span className="metric-card__per-game">{perGame(total, games)} per game</span> : null}
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

function PossessionStat({
  label,
  value,
  total,
  variant,
}: {
  label: string;
  value: number;
  total: number;
  variant?: "lost-plays";
}) {
  const pctLabel = `${percent(value, total)}% of possessions`;

  return (
    <div className={`metric-card${variant === "lost-plays" ? " metric-card--lost-plays" : ""}`}>
      <h3 className="metric-card__title">{label}</h3>
      <span className="metric-card__value">{value}</span>
      <span className={`metric-card__pct${variant === "lost-plays" ? " metric-card__pct--lost-plays" : ""}`}>{pctLabel}</span>
    </div>
  );
}

function StatFigure({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "accent" | "recover";
}) {
  return (
    <div className={`stat-figure${tone ? ` stat-figure--${tone}` : ""}`}>
      <span className="stat-figure__value">{value}</span>
      <span className="stat-figure__label">{label}</span>
    </div>
  );
}

function BalanceBar({
  primary,
  secondary,
  primaryTone,
  secondaryTone,
  label,
}: {
  primary: number;
  secondary: number;
  primaryTone: "positive" | "negative" | "accent" | "recover" | "muted";
  secondaryTone: "positive" | "negative" | "accent" | "recover" | "muted";
  label: string;
}) {
  const total = primary + secondary;
  const primaryPct = total > 0 ? (primary / total) * 100 : 0;

  return (
    <div className="stats-bar" role="img" aria-label={label}>
      {total === 0 ? (
        <span className="stats-bar__seg stats-bar__seg--muted" style={{ width: "100%" }} />
      ) : (
        <>
          <span className={`stats-bar__seg stats-bar__seg--${primaryTone}`} style={{ width: `${primaryPct}%` }} />
          <span className={`stats-bar__seg stats-bar__seg--${secondaryTone}`} style={{ width: `${100 - primaryPct}%` }} />
        </>
      )}
    </div>
  );
}

function TotalFigure({ value, games }: { value: number; games?: number }) {
  return (
    <span className="metric-total">
      <span className="metric-card__value">{value}</span>
      {games ? <span className="metric-total__per">{perGame(value, games)} per game</span> : null}
    </span>
  );
}

function StatsPanel({
  title,
  rate,
  rateLabel,
  extra,
  bar,
  figures,
  single,
}: {
  title: string;
  rate?: string;
  rateLabel?: string;
  extra?: ReactNode;
  bar: ReactNode;
  figures: ReactNode;
  single?: boolean;
}) {
  return (
    <section className="stats-panel">
      <header className="stats-panel__head">
        <h3 className="stats-panel__title">{title}</h3>
        {rate ? (
          <p className="stats-panel__rate">
            <strong>{rate}</strong>
            {rateLabel}
            {extra}
          </p>
        ) : null}
        </header>
      <div className={`stats-split${single ? " stats-split--single" : ""}`}>{figures}</div>
      {bar}
    </section>
  );
}

function StatsBoard({ summary, games }: { summary: MatchSummary; games?: number }) {
  return (
    <div className="stats-board">
      <StatsPanel
        title="General passing"
        rate={String(summary.totalPasses)}
        rateLabel="passes"
        extra={
          <>
            {games ? <span className="stats-panel__per">{perGame(summary.totalPasses, games)} per game</span> : null}
            <span className="stats-panel__pair">
              <span className="stats-panel__dot" aria-hidden="true">
                ·
              </span>
              <strong className="stats-panel__accuracy">{summary.accuracy}%</strong>
              accurate
            </span>
          </>
        }
        bar={
          <BalanceBar
            primary={summary.accurate}
            secondary={summary.inaccurate}
            primaryTone="positive"
            secondaryTone="negative"
            label={`${summary.accurate} accurate and ${summary.inaccurate} inaccurate`}
          />
        }
        figures={
          <>
            <StatFigure label="Accurate" value={String(summary.accurate)} tone="positive" />
            <StatFigure label="Inaccurate" value={String(summary.inaccurate)} tone="negative" />
          </>
        }
      />
      <StatsPanel
        title="Interceptions & recoveries"
        rate={String(summary.regains)}
        rateLabel="total"
        extra={games ? <span className="stats-panel__per">{perGame(summary.regains, games)} per game</span> : null}
        bar={
          <BalanceBar
            primary={summary.interceptions}
            secondary={summary.recoveries}
            primaryTone="accent"
            secondaryTone="recover"
            label={`${summary.interceptions} interceptions and ${summary.recoveries} recoveries`}
          />
        }
        figures={
          <>
            <StatFigure label="Interceptions" value={String(summary.interceptions)} tone="accent" />
            <StatFigure label="Recoveries" value={String(summary.recoveries)} tone="recover" />
          </>
        }
      />
      <StatsPanel
        title="Offensive duels"
        rate={`${summary.offensiveWinRate}%`}
        rateLabel="won"
        bar={
          <BalanceBar
            primary={summary.offensiveWon}
            secondary={summary.offensiveLost}
            primaryTone="positive"
            secondaryTone="negative"
            label={`${summary.offensiveWon} won and ${summary.offensiveLost} lost`}
          />
        }
        figures={
          <>
            <StatFigure label="Won" value={String(summary.offensiveWon)} tone="positive" />
            <StatFigure label="Lost" value={String(summary.offensiveLost)} tone="negative" />
          </>
        }
      />
      <StatsPanel
        title="Defensive duels"
        rate={`${summary.defensiveWinRate}%`}
        rateLabel="won"
        bar={
          <BalanceBar
            primary={summary.defensiveWon}
            secondary={summary.defensiveLost}
            primaryTone="positive"
            secondaryTone="negative"
            label={`${summary.defensiveWon} won and ${summary.defensiveLost} lost`}
          />
        }
        figures={
          <>
            <StatFigure label="Won" value={String(summary.defensiveWon)} tone="positive" />
            <StatFigure label="Lost" value={String(summary.defensiveLost)} tone="negative" />
          </>
        }
      />
    </div>
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

const CHICAGO_EXPLORE_MATCH_ID = "chicago-fire";

function buildPossessionsContent(
  match: MatchStats,
  exploreView: ChicagoExploreView,
): ReactNode {
  const { possessions, duels, games } = match;
  const scope = match.id === "season" ? "season" : "match";

  if (exploreView === "v2") {
    return (
      <>
        <div className="metric-card metric-card--hero metric-card--compact">
          <h3 className="metric-card__title">Total possessions</h3>
          <TotalFigure value={possessions.total} games={games} />
          <p className="metric-card__caption">Ball possessions in the {scope}</p>
        </div>
        <PossessionSplitView possessions={possessions} />
      </>
    );
  }

  if (exploreView === "v3") {
    return (
      <>
        <div className="metric-card metric-card--hero metric-card--compact">
          <h3 className="metric-card__title">Total possessions</h3>
          <TotalFigure value={possessions.total} games={games} />
          <p className="metric-card__caption">Ball possessions in the {scope}</p>
        </div>
        <PossessionShareView possessions={possessions} />
      </>
    );
  }

  return (
    <>
      <div className="metric-card metric-card--hero">
        <h3 className="metric-card__title">Total possessions</h3>
        <TotalFigure value={possessions.total} games={games} />
        <p className="metric-card__caption">Ball possessions in the {scope}</p>
      </div>
      {duels ? (
        <p className="metric-note">
          Dispossessed are offensive duels lost. Wrong passes are the bad passes. Lost plays add the two together.
        </p>
      ) : null}
      <MetricFlow
        items={[
          <PossessionStat key="lb" label="Dispossessed" value={possessions.lostBalls} total={possessions.total} />,
          <PossessionStat key="wp" label="Wrong passes" value={possessions.wrongPasses} total={possessions.total} />,
          <PossessionStat
            key="lp"
            label="Lost Plays"
            value={possessions.lostPlays}
            total={possessions.total}
            variant="lost-plays"
          />,
        ]}
      />
    </>
  );
}

function buildStatsContent(match: MatchStats, exploreView: ChicagoExploreView, summary: MatchSummary): ReactNode {
  const { games } = match;
  if (exploreView === "v2") {
    return <StatsHeroSideboard summary={summary} games={games} />;
  }
  if (exploreView === "v3") {
    return <StatsColumnBoard summary={summary} games={games} />;
  }
  return <StatsBoard summary={summary} games={games} />;
}

function buildTopics(match: MatchStats, exploreView: ChicagoExploreView = "classic"): Topic[] {
  const { passesUnderPressure, passResults, games } = match;
  const chicagoExplore = match.id === CHICAGO_EXPLORE_MATCH_ID ? exploreView : "classic";
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
      content: buildPossessionsContent(match, chicagoExplore),
    },
  ];

  const summary = matchSummary(match);
  if (summary) {
    topics.push({
      id: "stats",
      title: "Stats",
      phase: "stats",
      content: buildStatsContent(match, chicagoExplore, summary),
    });
  }

  return topics;
}

function ChicagoExploreTabs({
  view,
  onChange,
}: {
  view: ChicagoExploreView;
  onChange: (view: ChicagoExploreView) => void;
}) {
  const tabs: { id: ChicagoExploreView; label: string }[] = [
    { id: "classic", label: "Classic" },
    { id: "v2", label: "v2" },
    { id: "v3", label: "v3" },
  ];

  return (
    <div className="view-tabs" role="tablist" aria-label="Chicago Fire layout alternatives">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className={`view-tabs__tab${view === tab.id ? " is-active" : ""}`}
          aria-selected={view === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function GameStatsReport({ report }: GameStatsReportProps) {
  const { player, meta, matches } = report;
  const options = useMemo(() => [...matches, seasonMatch(matches)], [matches]);
  const initialMatchId = matches.find((match) => match.kind === "session")?.id ?? matches[0]?.id ?? "";
  const [matchId, setMatchId] = useState(initialMatchId);
  const [chicagoExploreView, setChicagoExploreView] = useState<ChicagoExploreView>("classic");
  const match = options.find((item) => item.id === matchId) ?? options[0];
  const exportStats: GameStats = useMemo(() => toGameStats(report, match), [report, match]);
  const topics = useMemo(
    () => buildTopics(match, match.id === CHICAGO_EXPLORE_MATCH_ID ? chicagoExploreView : "classic"),
    [match, chicagoExploreView],
  );

  function handleMatchChange(id: string) {
    setMatchId(id);
    if (id !== CHICAGO_EXPLORE_MATCH_ID) {
      setChicagoExploreView("classic");
    }
  }

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
              <MatchSwitcher matches={options} activeId={match.id} onChange={handleMatchChange} />
              {match.id === CHICAGO_EXPLORE_MATCH_ID ? (
                <ChicagoExploreTabs view={chicagoExploreView} onChange={setChicagoExploreView} />
              ) : null}
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
