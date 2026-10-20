import type { ReactNode } from "react";
import { PerGameBadge } from "@/components/PerGameBadge";
import type { MatchStats, MatchSummary } from "@/lib/stats";

type PossessionSource = MatchStats["possessions"];

type Tone = "positive" | "negative" | "accent" | "recover" | "warn" | "muted";

function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function possessionParts(possessions: PossessionSource) {
  const lostPlays = possessions.lostPlays;
  const retained = Math.max(possessions.total - lostPlays, 0);
  return {
    total: possessions.total,
    retained,
    lostPlays,
    dispossessed: possessions.lostBalls,
    wrongPasses: possessions.wrongPasses,
  };
}

function ExploreSplit({
  title,
  headline,
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  primaryTone,
  secondaryTone,
}: {
  title: string;
  headline: string;
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryTone: Tone;
  secondaryTone: Tone;
}) {
  const total = primary + secondary;
  const primaryPct = percent(primary, total);

  return (
    <div className="metric-card metric-card--major">
      <h3 className="metric-card__title">{title}</h3>
      <p className="metric-card__headline">{headline}</p>
      <div
        className="meter"
        role="img"
        aria-label={`${primaryLabel}: ${primary}. ${secondaryLabel}: ${secondary}.`}
      >
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

function ExploreBar({
  primary,
  secondary,
  primaryTone,
  secondaryTone,
  label,
}: {
  primary: number;
  secondary: number;
  primaryTone: Tone;
  secondaryTone: Tone;
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

export function PossessionBoard({
  possessions,
  scopeLabel = "match",
  totalFigure,
}: {
  possessions: PossessionSource;
  scopeLabel?: string;
  totalFigure: ReactNode;
}) {
  const parts = possessionParts(possessions);

  return (
    <>
      <div className="possessions-board">
        <div className="metric-card metric-card--hero metric-card--compact">
          <h3 className="metric-card__title">Total possessions</h3>
          {totalFigure}
          <p className="metric-card__caption">Ball possessions in the {scopeLabel}</p>
        </div>
        <ExploreSplit
          title="Possession outcomes"
          headline={`${parts.retained} retained · ${parts.lostPlays} lost plays`}
          primary={parts.retained}
          secondary={parts.lostPlays}
          primaryLabel="Retained"
          secondaryLabel="Lost plays"
          primaryTone="positive"
          secondaryTone="negative"
        />
        <ExploreSplit
          title="Lost play breakdown"
          headline={`${parts.dispossessed} dispossessed · ${parts.wrongPasses} wrong passes`}
          primary={parts.dispossessed}
          secondary={parts.wrongPasses}
          primaryLabel="Dispossessed"
          secondaryLabel="Wrong passes"
          primaryTone="negative"
          secondaryTone="warn"
        />
      </div>
      <p className="metric-note metric-note--compact">
        Dispossessed are offensive duels lost. Wrong passes are the bad passes. Lost plays add the two together.
      </p>
    </>
  );
}

function StatsMetricCard({
  title,
  value,
  unit,
  rate,
  extra,
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  primaryTone,
  secondaryTone,
  className,
}: {
  title: string;
  value: string;
  unit: string;
  rate?: string;
  extra?: ReactNode;
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryTone: Tone;
  secondaryTone: Tone;
  className?: string;
}) {
  return (
    <section className={`stats-metric-card stats-hero-row${className ? ` ${className}` : ""}`}>
      <div className="stats-hero-row__lead">
        <h3 className="stats-hero-row__title">{title}</h3>
        <p className="stats-hero-row__value">{value}</p>
        <p className="stats-hero-row__unit">{unit}</p>
        {rate ? <p className="stats-metric-card__rate">{rate}</p> : null}
        {extra ? <div className="stats-hero-row__meta">{extra}</div> : null}
      </div>
      <div className="stats-hero-row__chart">
        <ExploreBar
          primary={primary}
          secondary={secondary}
          primaryTone={primaryTone}
          secondaryTone={secondaryTone}
          label={`${primaryLabel} ${primary}. ${secondaryLabel} ${secondary}.`}
        />
        <ul className="stats-hero-row__legend">
          <li>
            <span className={`legend__dot legend__dot--${primaryTone}`} />
            <span>{primaryLabel}</span>
            <strong>{primary}</strong>
          </li>
          <li>
            <span className={`legend__dot legend__dot--${secondaryTone}`} />
            <span>{secondaryLabel}</span>
            <strong>{secondary}</strong>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function StatsHeroSideboard({ summary, games }: { summary: MatchSummary; games?: number }) {
  const offensiveTotal = summary.offensiveWon + summary.offensiveLost;
  const defensiveTotal = summary.defensiveWon + summary.defensiveLost;

  return (
    <div className="stats-metric-grid">
      <StatsMetricCard
        title="General Passing"
        value={String(summary.totalPasses)}
        unit="Total passes"
        rate={`${summary.accuracy}% accurate`}
        extra={games ? <PerGameBadge total={summary.totalPasses} games={games} /> : null}
        primary={summary.accurate}
        secondary={summary.inaccurate}
        primaryLabel="Accurate"
        secondaryLabel="Inaccurate"
        primaryTone="positive"
        secondaryTone="negative"
      />
      <StatsMetricCard
        title="Offensive Duels"
        value={String(offensiveTotal)}
        unit="Total duels"
        rate={`${summary.offensiveWinRate}% won rate`}
        primary={summary.offensiveWon}
        secondary={summary.offensiveLost}
        primaryLabel="Won"
        secondaryLabel="Lost"
        primaryTone="positive"
        secondaryTone="negative"
      />
      <StatsMetricCard
        title="Defensive Duels"
        value={String(defensiveTotal)}
        unit="Total duels"
        rate={`${summary.defensiveWinRate}% won rate`}
        primary={summary.defensiveWon}
        secondary={summary.defensiveLost}
        primaryLabel="Won"
        secondaryLabel="Lost"
        primaryTone="positive"
        secondaryTone="negative"
      />
      <StatsMetricCard
        className="stats-metric-card--regains"
        title="Regains"
        value={String(summary.regains)}
        unit="Total regains"
        extra={games ? <PerGameBadge total={summary.regains} games={games} /> : null}
        primary={summary.interceptions}
        secondary={summary.recoveries}
        primaryLabel="Interceptions"
        secondaryLabel="Recoveries"
        primaryTone="accent"
        secondaryTone="recover"
      />
    </div>
  );
}
