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

export function PossessionSplitView({
  possessions,
  scopeLabel = "match",
}: {
  possessions: PossessionSource;
  scopeLabel?: string;
}) {
  const parts = possessionParts(possessions);

  return (
    <div className="explore-stack">
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
      <p className="metric-note metric-note--compact">
        {parts.total} possessions in the {scopeLabel}. Dispossessed are offensive duels lost. Wrong passes are the bad passes.
      </p>
    </div>
  );
}

function StatsHeroRow({
  title,
  value,
  unit,
  meta,
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  primaryTone,
  secondaryTone,
}: {
  title: string;
  value: string;
  unit: string;
  meta?: ReactNode;
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryTone: Tone;
  secondaryTone: Tone;
}) {
  return (
    <section className="stats-hero-row">
      <div className="stats-hero-row__lead">
        <h3 className="stats-hero-row__title">{title}</h3>
        <p className="stats-hero-row__value">{value}</p>
        <p className="stats-hero-row__unit">{unit}</p>
        {meta ? <div className="stats-hero-row__meta">{meta}</div> : null}
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
  return (
    <div className="stats-hero-board">
      <StatsHeroRow
        title="General passing"
        value={String(summary.totalPasses)}
        unit="Total passes"
        meta={
          <>
            <span className="stats-accuracy-pill">{summary.accuracy}% accurate</span>
            {games ? <PerGameBadge total={summary.totalPasses} games={games} /> : null}
          </>
        }
        primary={summary.accurate}
        secondary={summary.inaccurate}
        primaryLabel="Accurate"
        secondaryLabel="Inaccurate"
        primaryTone="positive"
        secondaryTone="negative"
      />
      <StatsHeroRow
        title="Interceptions & recoveries"
        value={String(summary.regains)}
        unit="Total regains"
        meta={games ? <PerGameBadge total={summary.regains} games={games} /> : null}
        primary={summary.interceptions}
        secondary={summary.recoveries}
        primaryLabel="Interceptions"
        secondaryLabel="Recoveries"
        primaryTone="accent"
        secondaryTone="recover"
      />
      <StatsHeroRow
        title="Offensive duels"
        value={`${summary.offensiveWinRate}%`}
        unit="Won rate"
        primary={summary.offensiveWon}
        secondary={summary.offensiveLost}
        primaryLabel="Won"
        secondaryLabel="Lost"
        primaryTone="positive"
        secondaryTone="negative"
      />
      <StatsHeroRow
        title="Defensive duels"
        value={`${summary.defensiveWinRate}%`}
        unit="Won rate"
        primary={summary.defensiveWon}
        secondary={summary.defensiveLost}
        primaryLabel="Won"
        secondaryLabel="Lost"
        primaryTone="positive"
        secondaryTone="negative"
      />
    </div>
  );
}
