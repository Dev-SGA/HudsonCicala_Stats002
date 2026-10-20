import type { MatchStats, MatchSummary } from "@/lib/stats";
import { perGame } from "@/lib/stats";

export type ChicagoExploreView = "classic" | "v2" | "v3";

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

/** v2: retained vs lost, then how the lost plays split. */
export function PossessionSplitView({ possessions }: { possessions: PossessionSource }) {
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
        {parts.total} possessions in the match. Dispossessed are offensive duels lost. Wrong passes are the bad passes.
      </p>
    </div>
  );
}

/** v3: hero on retained, share-list for the rest. */
export function PossessionShareView({ possessions }: { possessions: PossessionSource }) {
  const parts = possessionParts(possessions);
  const rows = [
    {
      label: "Dispossessed",
      value: parts.dispossessed,
      tone: "negative" as const,
    },
    {
      label: "Wrong passes",
      value: parts.wrongPasses,
      tone: "warn" as const,
    },
    {
      label: "Lost plays",
      value: parts.lostPlays,
      tone: "negative" as const,
      emphasize: true,
    },
  ];

  return (
    <div className="explore-stack">
      <div className="metric-card metric-card--hero metric-card--retained">
        <h3 className="metric-card__title">Retained possessions</h3>
        <span className="metric-card__value">{parts.retained}</span>
        <span className="metric-card__pct">{percent(parts.retained, parts.total)}% of {parts.total} possessions</span>
      </div>
      <ul className="share-list share-list--possessions">
        {rows.map((row) => (
          <li key={row.label} className={`share-list__item${row.emphasize ? " share-list__item--lost-plays" : ""}`}>
            <div className="share-list__row">
              <span className="share-list__label">{row.label}</span>
              <span className="share-list__track">
                <span
                  className={`share-list__fill share-list__fill--${row.tone}`}
                  style={{ width: `${percent(row.value, parts.total)}%` }}
                />
              </span>
              <span className="share-list__value">{row.value}</span>
              <span className="share-list__pct">{percent(row.value, parts.total)}%</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatsHeroRow({
  title,
  value,
  unit,
  detail,
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
  detail?: string;
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
        {detail ? <p className="stats-hero-row__detail">{detail}</p> : null}
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

/** v2 stats: large title and total on the left, breakdown chart on the right. */
export function StatsHeroSideboard({ summary, games }: { summary: MatchSummary; games?: number }) {
  return (
    <div className="stats-hero-board">
      <StatsHeroRow
        title="General passing"
        value={String(summary.totalPasses)}
        unit="Total passes"
        detail={`${summary.accuracy}% accurate${games ? ` · ${perGame(summary.totalPasses, games)} per game` : ""}`}
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
        detail={games ? `${perGame(summary.regains, games)} per game` : undefined}
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

function StatsColumnPanel({
  title,
  kpi,
  unit,
  detail,
  bars,
}: {
  title: string;
  kpi: string;
  unit: string;
  detail?: string;
  bars: { label: string; value: number; tone: Tone }[];
}) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <section className="stats-panel stats-panel--columns">
      <header className="stats-panel__head stats-panel__head--stack">
        <h3 className="stats-panel__title stats-panel__title--large">{title}</h3>
        <p className="stats-panel__rate stats-panel__rate--hero">
          <strong>{kpi}</strong>
          {unit}
        </p>
        {detail ? <p className="stats-panel__detail">{detail}</p> : null}
      </header>
      <div className="stats-column-chart">
        {bars.map((bar) => (
          <div key={bar.label} className="stats-column-chart__item">
            <span className={`stats-column-chart__value stats-column-chart__value--${bar.tone}`}>{bar.value}</span>
            <span className="stats-column-chart__bar-wrap">
              <span
                className={`stats-column-chart__bar stats-column-chart__bar--${bar.tone}`}
                style={{ height: `${(bar.value / max) * 100}%` }}
              />
            </span>
            <span className="stats-column-chart__label">{bar.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** v3 stats: emphasized header band with column detail beside each total. */
export function StatsColumnBoard({ summary, games }: { summary: MatchSummary; games?: number }) {
  return (
    <div className="stats-board stats-board--columns">
      <StatsColumnPanel
        title="General passing"
        kpi={String(summary.totalPasses)}
        unit="passes"
        detail={`${summary.accuracy}% accurate${games ? ` · ${perGame(summary.totalPasses, games)} per game` : ""}`}
        bars={[
          { label: "Accurate", value: summary.accurate, tone: "positive" },
          { label: "Inaccurate", value: summary.inaccurate, tone: "negative" },
        ]}
      />
      <StatsColumnPanel
        title="Interceptions & recoveries"
        kpi={String(summary.regains)}
        unit="total"
        detail={games ? `${perGame(summary.regains, games)} per game` : undefined}
        bars={[
          { label: "Interceptions", value: summary.interceptions, tone: "accent" },
          { label: "Recoveries", value: summary.recoveries, tone: "recover" },
        ]}
      />
      <StatsColumnPanel
        title="Offensive duels"
        kpi={`${summary.offensiveWinRate}%`}
        unit="won"
        bars={[
          { label: "Won", value: summary.offensiveWon, tone: "positive" },
          { label: "Lost", value: summary.offensiveLost, tone: "negative" },
        ]}
      />
      <StatsColumnPanel
        title="Defensive duels"
        kpi={`${summary.defensiveWinRate}%`}
        unit="won"
        bars={[
          { label: "Won", value: summary.defensiveWon, tone: "positive" },
          { label: "Lost", value: summary.defensiveLost, tone: "negative" },
        ]}
      />
    </div>
  );
}
