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

function StatsBarCard({
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  primaryTone,
  secondaryTone,
}: {
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryTone: Tone;
  secondaryTone: Tone;
}) {
  return (
    <div className="stats-stat-card stats-stat-card--bars">
      <ExploreBar
        primary={primary}
        secondary={secondary}
        primaryTone={primaryTone}
        secondaryTone={secondaryTone}
        label={`${primaryLabel} ${primary}. ${secondaryLabel} ${secondary}.`}
      />
      <ul className="stats-stat-card__legend">
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
  );
}

function StatsRateTopic({
  title,
  total,
  totalUnit,
  rate,
  rateUnit,
  totalExtra,
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  primaryTone,
  secondaryTone,
}: {
  title: string;
  total: number;
  totalUnit: string;
  rate: number;
  rateUnit: string;
  totalExtra?: ReactNode;
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryTone: Tone;
  secondaryTone: Tone;
}) {
  return (
    <section className="stats-topic">
      <h3 className="stats-topic__title">{title}</h3>
      <div className="stats-topic__cards">
        <div className="stats-stat-card stats-stat-card--total">
          <span className="stats-stat-card__kicker">Total</span>
          <span className="stats-stat-card__value">{total}</span>
          <span className="stats-stat-card__unit">{totalUnit}</span>
          {totalExtra ? <div className="stats-stat-card__extra">{totalExtra}</div> : null}
        </div>
        <div className="stats-stat-card stats-stat-card--rate">
          <span className="stats-stat-card__kicker">Rate</span>
          <span className="stats-stat-card__value">{rate}%</span>
          <span className="stats-stat-card__unit">{rateUnit}</span>
        </div>
        <StatsBarCard
          primary={primary}
          secondary={secondary}
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
          primaryTone={primaryTone}
          secondaryTone={secondaryTone}
        />
      </div>
    </section>
  );
}

export function StatsHeroSideboard({ summary, games }: { summary: MatchSummary; games?: number }) {
  const offensiveTotal = summary.offensiveWon + summary.offensiveLost;
  const defensiveTotal = summary.defensiveWon + summary.defensiveLost;

  return (
    <div className="stats-board-v2">
      <StatsRateTopic
        title="General Passing"
        total={summary.totalPasses}
        totalUnit="Total passes"
        rate={summary.accuracy}
        rateUnit="Accurate"
        totalExtra={games ? <PerGameBadge total={summary.totalPasses} games={games} /> : null}
        primary={summary.accurate}
        secondary={summary.inaccurate}
        primaryLabel="Accurate"
        secondaryLabel="Inaccurate"
        primaryTone="positive"
        secondaryTone="negative"
      />
      <StatsRateTopic
        title="Offensive Duels"
        total={offensiveTotal}
        totalUnit="Total duels"
        rate={summary.offensiveWinRate}
        rateUnit="Won rate"
        primary={summary.offensiveWon}
        secondary={summary.offensiveLost}
        primaryLabel="Won"
        secondaryLabel="Lost"
        primaryTone="positive"
        secondaryTone="negative"
      />
      <StatsRateTopic
        title="Defensive Duels"
        total={defensiveTotal}
        totalUnit="Total duels"
        rate={summary.defensiveWinRate}
        rateUnit="Won rate"
        primary={summary.defensiveWon}
        secondary={summary.defensiveLost}
        primaryLabel="Won"
        secondaryLabel="Lost"
        primaryTone="positive"
        secondaryTone="negative"
      />
      <section className="stats-topic">
        <h3 className="stats-topic__title">Regains</h3>
        <div className="stats-topic__cards stats-topic__cards--pair">
          <div className="stats-stat-card stats-stat-card--total">
            <span className="stats-stat-card__kicker">Total</span>
            <span className="stats-stat-card__value">{summary.regains}</span>
            <span className="stats-stat-card__unit">Total regains</span>
            {games ? (
              <div className="stats-stat-card__extra">
                <PerGameBadge total={summary.regains} games={games} />
              </div>
            ) : null}
          </div>
          <StatsBarCard
            primary={summary.interceptions}
            secondary={summary.recoveries}
            primaryLabel="Interceptions"
            secondaryLabel="Recoveries"
            primaryTone="accent"
            secondaryTone="recover"
          />
        </div>
      </section>
    </div>
  );
}
