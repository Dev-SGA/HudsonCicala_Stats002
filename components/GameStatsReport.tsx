"use client";

import { useMemo, useState } from "react";
import { AthleteProfileCard } from "@/components/AthleteProfileCard";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { VideoLinksProvider } from "@/components/VideoLinksContext";
import { MetricFlow } from "@/components/MetricFlow";
import { SgaBrand } from "@/components/SgaBrand";
import { SgaCornerBrand } from "@/components/SgaCornerBrand";
import { TopicsBoard, type Topic } from "@/components/TopicsBoard";
import { TrendCharts } from "@/components/TrendCharts";
import { BRAND } from "@/lib/brand";
import {
  duelNeutral,
  toGameStats,
  type DuelAction,
  type DuelBlock,
  type GameStats,
  type MatchStats,
  type PassResultBreakdown,
  type StatsReport,
} from "@/lib/stats";

type GameStatsReportProps = {
  report: StatsReport;
};

type BarTone = "accent" | "positive" | "negative" | "muted" | "warn";
type View = "match" | "trends";

const PASS_PLAY_TIPS = {
  progressive:
    "Progressive Play — Finding a teammate with a clear opportunity to progress the ball, create a scoring opportunity, or a pass that break defensive lines.",
  neutral:
    "Neutral Play — Finding a teammate without a clear opportunity to progress the ball, but with a clear option to maintain possession.",
  lost: "Lost Play — Losing possession through an inaccurate pass or finding a teammate who is immediately under pressure and at high risk of losing possession.",
} as const;

const DUEL_GROUPS: {
  title: string;
  items: { key: keyof DuelBlock; label: string; tone: "positive" | "negative" | "warn" | "accent" }[];
}[] = [
  {
    title: "Offensive",
    items: [
      { key: "offensiveWon", label: "Offensive won", tone: "positive" },
      { key: "offensiveLost", label: "Offensive lost", tone: "negative" },
      { key: "fouled", label: "Fouled", tone: "warn" },
    ],
  },
  {
    title: "Defensive",
    items: [
      { key: "defensiveWon", label: "Defensive won", tone: "positive" },
      { key: "defensiveLost", label: "Defensive lost", tone: "negative" },
      { key: "fouls", label: "Fouls", tone: "negative" },
      { key: "interception", label: "Interception", tone: "accent" },
      { key: "recovery", label: "Recovery", tone: "accent" },
    ],
  },
];

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

function PassResultsMeter({ title, breakdown }: { title: string; breakdown: PassResultBreakdown }) {
  const total = breakdown.progressive + breakdown.neutral + breakdown.lost;
  const progressivePct = percent(breakdown.progressive, total);
  const neutralPct = percent(breakdown.neutral, total);
  const lostPct = percent(breakdown.lost, total);

  return (
    <div className="metric-card">
      <h3 className="metric-card__title">{title}</h3>
      <p className="metric-card__headline">{total} passes</p>
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

function DuelCard({ label, action, tone }: { label: string; action: DuelAction; tone: string }) {
  const neutral = duelNeutral(action);
  const total = action.actions;
  const goodPct = percent(action.good, total);
  const neutralPct = percent(neutral, total);
  const badPct = percent(action.bad, total);

  return (
    <article className={`duel-card duel-card--${tone}`}>
      <h4 className="duel-card__title">{label}</h4>
      <p className="duel-card__value">{action.actions}</p>
      <p className="duel-card__split">
        {action.actions} actions · {action.good} good · {action.bad} bad
      </p>
      <div
        className="meter"
        role="img"
        aria-label={`${label}: ${action.actions} actions, ${action.good} good, ${neutral} neutral, ${action.bad} bad.`}
      >
        {total === 0 ? <span className="meter__seg meter__seg--muted" style={{ width: "100%" }} /> : null}
        {action.good > 0 ? <span className="meter__seg meter__seg--positive" style={{ width: `${goodPct}%` }} /> : null}
        {neutral > 0 ? <span className="meter__seg meter__seg--muted" style={{ width: `${neutralPct}%` }} /> : null}
        {action.bad > 0 ? <span className="meter__seg meter__seg--negative" style={{ width: `${badPct}%` }} /> : null}
      </div>
      <p className="duel-card__neutral">{neutral} neutral</p>
    </article>
  );
}

function DuelsBoard({ duels }: { duels: DuelBlock }) {
  return (
    <div className="duel-groups">
      {DUEL_GROUPS.map((group) => (
        <section key={group.title} className="duel-group">
          <h3 className="duel-group__title">{group.title}</h3>
          <div className="duel-grid">
            {group.items.map((item) => (
              <DuelCard key={item.key} label={item.label} action={duels[item.key]} tone={item.tone} />
            ))}
          </div>
        </section>
      ))}
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
  const session = matches.filter((match) => match.kind === "session");
  const baseline = matches.find((match) => match.kind === "baseline");
  const sessionIndex = session.findIndex((match) => match.id === activeId);
  const onSession = sessionIndex >= 0;

  return (
    <div className="match-nav">
      <div className="match-nav__session" role="group" aria-label="Session matches">
        <button
          type="button"
          className="match-nav__arrow"
          onClick={() => onChange(session[sessionIndex - 1].id)}
          disabled={!onSession || sessionIndex === 0}
          aria-label="Previous match"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="match-nav__pills">
          {session.map((match) => (
            <button
              key={match.id}
              type="button"
              className={`match-nav__pill${match.id === activeId ? " is-active" : ""}`}
              aria-pressed={match.id === activeId}
              onClick={() => onChange(match.id)}
            >
              {match.shortLabel}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="match-nav__arrow"
          onClick={() => onChange(session[sessionIndex + 1].id)}
          disabled={!onSession || sessionIndex === session.length - 1}
          aria-label="Next match"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      {baseline ? (
        <button
          type="button"
          className={`btn btn--ghost match-nav__first${baseline.id === activeId ? " is-active" : ""}`}
          aria-pressed={baseline.id === activeId}
          onClick={() => onChange(baseline.id)}
        >
          First match
        </button>
      ) : null}
    </div>
  );
}

function buildTopics(match: MatchStats): Topic[] {
  const { passesUnderPressure, passResults, possessions, duels } = match;
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
              <span className="metric-card__value">{passesUnderPressure.total}</span>
              <p className="metric-card__caption">Passes tracked in the match</p>
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
        <MetricFlow
          items={[
            <PassResultsMeter key="up" title="Under pressure" breakdown={passResults.underPressure} />,
            <PassResultsMeter key="nop" title="Not under pressure" breakdown={passResults.notUnderPressure} />,
          ]}
        />
      ),
    },
    {
      id: "possessions",
      title: "Possessions",
      phase: "build-up",
      content: (
        <>
          <div className="metric-card metric-card--hero">
            <h3 className="metric-card__title">Total possessions</h3>
            <span className="metric-card__value">{possessions.total}</span>
            <p className="metric-card__caption">Ball possessions in the match</p>
          </div>
          {duels ? (
            <p className="metric-note">
              Lost balls are offensive duels lost. Wrong passes are the bad passes. Lost plays add the two together.
            </p>
          ) : null}
          <MetricFlow
            items={[
              <PossessionStat key="lb" label="Lost balls" value={possessions.lostBalls} total={possessions.total} />,
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
      ),
    },
  ];

  if (duels) {
    topics.push({
      id: "duels",
      title: "Duels",
      phase: "duels",
      content: <DuelsBoard duels={duels} />,
    });
  }

  return topics;
}

export function GameStatsReport({ report }: GameStatsReportProps) {
  const { player, meta, matches } = report;
  const initialMatchId = matches.find((match) => match.kind === "session")?.id ?? matches[0]?.id ?? "";
  const [view, setView] = useState<View>("match");
  const [matchId, setMatchId] = useState(initialMatchId);
  const match = matches.find((item) => item.id === matchId) ?? matches[0];
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
              {view === "trends" ? "Continuous evaluation · 3 matches" : match.label}
            </p>
          </div>
        </header>

        <div className="report-grid">
          <AthleteProfileCard name={player.name} club={player.club} photoSrc={player.photo}>
            <ExportPdfButton stats={exportStats} />
          </AthleteProfileCard>

          <main className="report-main">
            <div className="view-tabs" role="tablist" aria-label="Report views">
              <button
                type="button"
                role="tab"
                id="tab-match"
                className={`view-tabs__tab${view === "match" ? " is-active" : ""}`}
                aria-selected={view === "match"}
                aria-controls="panel-match"
                onClick={() => setView("match")}
              >
                Match
              </button>
              <button
                type="button"
                role="tab"
                id="tab-trends"
                className={`view-tabs__tab${view === "trends" ? " is-active" : ""}`}
                aria-selected={view === "trends"}
                aria-controls="panel-trends"
                onClick={() => setView("trends")}
              >
                Trends
              </button>
            </div>

            {view === "match" ? (
              <div id="panel-match" role="tabpanel" aria-labelledby="tab-match" className="view-panel">
                <MatchSwitcher matches={matches} activeId={match.id} onChange={setMatchId} />
                <TopicsBoard topics={topics} />
              </div>
            ) : (
              <div id="panel-trends" role="tabpanel" aria-labelledby="tab-trends" className="view-panel">
                <TrendCharts matches={matches} />
              </div>
            )}
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
