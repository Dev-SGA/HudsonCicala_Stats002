import type { MatchStats, MatchSummary } from "@/lib/stats";

export type ChicagoView = "classic" | "v2" | "v3";

type PossessionSource = MatchStats["possessions"];

type Tone = "positive" | "negative" | "accent" | "recover" | "warn";

const POSSESSION_NOTE =
  "Dispossessed are offensive duels lost. Wrong passes are the bad passes. Lost plays add the two together.";

function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function possessionParts(possessions: PossessionSource) {
  const dispossessed = possessions.lostBalls;
  const wrongPasses = possessions.wrongPasses;
  const kept = Math.max(possessions.total - dispossessed - wrongPasses, 0);
  return { kept, dispossessed, wrongPasses, total: possessions.total, lostPlays: possessions.lostPlays };
}

function PossessionNote() {
  return <p className="metric-note">{POSSESSION_NOTE}</p>;
}

function donutGradient(parts: { value: number; color: string }[], total: number): string {
  const gap = total > 0 ? 1.4 : 0;
  let cursor = 0;
  const stops: string[] = [];
  for (const part of parts) {
    const span = total > 0 ? (part.value / total) * 100 : 0;
    const end = cursor + Math.max(span - gap, 0);
    stops.push(`${part.color} ${cursor}% ${end}%`);
    stops.push(`transparent ${end}% ${cursor + span}%`);
    cursor += span;
  }
  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

export function PossessionDonut({ possessions }: { possessions: PossessionSource }) {
  const parts = possessionParts(possessions);
  const slices = [
    { label: "Kept", value: parts.kept, color: "var(--tone-positive)", tone: "positive" as const },
    { label: "Wrong passes", value: parts.wrongPasses, color: "var(--tone-warn)", tone: "warn" as const },
    { label: "Dispossessed", value: parts.dispossessed, color: "var(--tone-burnt-yellow)", tone: "negative" as const },
  ];
  const described = slices.map((slice) => `${slice.label}: ${slice.value}`).join(". ");

  return (
    <div className="explore-card">
      <div className="donut-layout">
        <div
          className="donut"
          style={{ background: donutGradient(slices, parts.total) }}
          role="img"
          aria-label={`${parts.total} possessions. ${described}. Lost plays: ${parts.lostPlays}.`}
        >
          <div className="donut__hole">
            <span className="donut__value">{parts.total}</span>
            <span className="donut__caption">Possessions</span>
          </div>
        </div>
        <div className="donut-layout__copy">
          <PossessionNote />
          <ul className="legend">
            {slices.map((slice) => (
              <li key={slice.label}>
                <span className={`legend__dot legend__dot--${slice.tone}`} />
                <span className="legend__label">{slice.label}</span>
                <strong>
                  {slice.value} · {percent(slice.value, parts.total)}%
                </strong>
              </li>
            ))}
          </ul>
          <p className="explore-callout">
            <span>Lost plays</span>
            <strong>{parts.lostPlays}</strong>
            <span>{percent(parts.lostPlays, parts.total)}% of possessions</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function PossessionWaterfall({ possessions }: { possessions: PossessionSource }) {
  const parts = possessionParts(possessions);
  const scale = parts.total || 1;
  const share = (value: number) => (value / scale) * 100;
  const rows = [
    { label: "Possessions", value: String(parts.total), tone: "accent" as const, offset: 0, width: share(parts.total) },
    {
      label: "Dispossessed",
      value: `−${parts.dispossessed}`,
      tone: "negative" as const,
      offset: share(parts.kept + parts.wrongPasses),
      width: share(parts.dispossessed),
    },
    {
      label: "Wrong passes",
      value: `−${parts.wrongPasses}`,
      tone: "warn" as const,
      offset: share(parts.kept),
      width: share(parts.wrongPasses),
    },
    { label: "Kept", value: String(parts.kept), tone: "positive" as const, offset: 0, width: share(parts.kept) },
  ];

  return (
    <div className="explore-card">
      <PossessionNote />
      <div
        className="fall"
        role="img"
        aria-label={`Possessions ${parts.total}. Dispossessed ${parts.dispossessed}. Wrong passes ${parts.wrongPasses}. Kept ${parts.kept}. Lost plays ${parts.lostPlays}.`}
      >
        {rows.map((row) => (
          <div key={row.label} className="fall__row">
            <span className="fall__name">{row.label}</span>
            <div className="fall__track">
              <span
                className={`fall__bar fall__bar--${row.tone}`}
                style={{ left: `${row.offset}%`, width: `${row.width}%` }}
              />
            </div>
            <strong className={`fall__value fall__value--${row.tone}`}>{row.value}</strong>
          </div>
        ))}
      </div>
      <p className="explore-callout">
        <span>Lost plays</span>
        <strong>{parts.lostPlays}</strong>
        <span>{percent(parts.lostPlays, parts.total)}% of possessions</span>
      </p>
    </div>
  );
}

function ColumnGroup({
  title,
  rate,
  rateLabel,
  bars,
}: {
  title: string;
  rate: string;
  rateLabel: string;
  bars: { label: string; value: number; tone: Tone }[];
}) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const described = bars.map((bar) => `${bar.label} ${bar.value}`).join(" and ");

  return (
    <section className="stats-panel col-chart__group">
      <header className="stats-panel__head">
        <h3 className="stats-panel__title">{title}</h3>
        <p className="stats-panel__rate">
          <strong>{rate}</strong>
          {rateLabel}
        </p>
      </header>
      <div className="col-chart__plot" role="img" aria-label={`${title}. ${described}.`}>
        {bars.map((bar) => (
          <div key={bar.label} className="col-chart__col">
            <span className={`col-chart__num col-chart__num--${bar.tone}`}>{bar.value}</span>
            <span className="col-chart__bar-wrap">
              <span className={`col-chart__bar col-chart__bar--${bar.tone}`} style={{ height: `${(bar.value / max) * 100}%` }} />
            </span>
            <span className="col-chart__name">{bar.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StatsColumns({ summary }: { summary: MatchSummary }) {
  return (
    <div className="col-chart">
      <ColumnGroup
        title="General passing"
        rate={`${summary.accuracy}%`}
        rateLabel="accurate"
        bars={[
          { label: "Accurate", value: summary.accurate, tone: "positive" },
          { label: "Inaccurate", value: summary.inaccurate, tone: "negative" },
        ]}
      />
      <ColumnGroup
        title="Offensive duels"
        rate={`${summary.offensiveWinRate}%`}
        rateLabel="won"
        bars={[
          { label: "Won", value: summary.offensiveWon, tone: "positive" },
          { label: "Lost", value: summary.offensiveLost, tone: "negative" },
        ]}
      />
      <ColumnGroup
        title="Defensive duels"
        rate={`${summary.defensiveWinRate}%`}
        rateLabel="won"
        bars={[
          { label: "Won", value: summary.defensiveWon, tone: "positive" },
          { label: "Lost", value: summary.defensiveLost, tone: "negative" },
        ]}
      />
      <ColumnGroup
        title="Interceptions & recoveries"
        rate={String(summary.regains)}
        rateLabel="total"
        bars={[
          { label: "Interceptions", value: summary.interceptions, tone: "accent" },
          { label: "Recoveries", value: summary.recoveries, tone: "recover" },
        ]}
      />
    </div>
  );
}

function Dumbbell({
  title,
  rate,
  rateLabel,
  left,
  right,
}: {
  title: string;
  rate: string;
  rateLabel: string;
  left: { label: string; value: number; tone: Tone };
  right: { label: string; value: number; tone: Tone };
}) {
  const max = Math.max(left.value, right.value, 1);
  const leftPct = (left.value / max) * 100;
  const rightPct = (right.value / max) * 100;
  const start = Math.min(leftPct, rightPct);
  const span = Math.max(rightPct, leftPct) - start;

  return (
    <section className="stats-panel dumbbell">
      <header className="stats-panel__head">
        <h3 className="stats-panel__title">{title}</h3>
        <p className="stats-panel__rate">
          <strong>{rate}</strong>
          {rateLabel}
        </p>
      </header>
      <div
        className="dumbbell__axis"
        role="img"
        aria-label={`${left.label} ${left.value}. ${right.label} ${right.value}.`}
      >
        <span className="dumbbell__rail" />
        <span className="dumbbell__link" style={{ left: `${start}%`, width: `${span}%` }} />
        <span className={`dumbbell__dot dumbbell__dot--${left.tone}`} style={{ left: `${leftPct}%` }} />
        <span className={`dumbbell__dot dumbbell__dot--${right.tone}`} style={{ left: `${rightPct}%` }} />
      </div>
      <ul className="legend dumbbell__legend">
        <li>
          <span className={`legend__dot legend__dot--${left.tone}`} />
          <span className="legend__label">{left.label}</span>
          <strong>{left.value}</strong>
        </li>
        <li>
          <span className={`legend__dot legend__dot--${right.tone}`} />
          <span className="legend__label">{right.label}</span>
          <strong>{right.value}</strong>
        </li>
      </ul>
    </section>
  );
}

export function StatsDumbbells({ summary }: { summary: MatchSummary }) {
  return (
    <div className="dumbbell-list">
      <Dumbbell
        title="General passing"
        rate={`${summary.accuracy}%`}
        rateLabel="accurate"
        left={{ label: "Inaccurate", value: summary.inaccurate, tone: "negative" }}
        right={{ label: "Accurate", value: summary.accurate, tone: "positive" }}
      />
      <Dumbbell
        title="Offensive duels"
        rate={`${summary.offensiveWinRate}%`}
        rateLabel="won"
        left={{ label: "Lost", value: summary.offensiveLost, tone: "negative" }}
        right={{ label: "Won", value: summary.offensiveWon, tone: "positive" }}
      />
      <Dumbbell
        title="Defensive duels"
        rate={`${summary.defensiveWinRate}%`}
        rateLabel="won"
        left={{ label: "Lost", value: summary.defensiveLost, tone: "negative" }}
        right={{ label: "Won", value: summary.defensiveWon, tone: "positive" }}
      />
      <Dumbbell
        title="Interceptions & recoveries"
        rate={String(summary.regains)}
        rateLabel="total"
        left={{ label: "Recoveries", value: summary.recoveries, tone: "recover" }}
        right={{ label: "Interceptions", value: summary.interceptions, tone: "accent" }}
      />
    </div>
  );
}
