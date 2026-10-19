import type { MatchStats } from "@/lib/stats";

type Point = number | null;

type Series = {
  id: string;
  label: string;
  color: string;
  values: Point[];
};

type ChartSpec = {
  id: string;
  title: string;
  note?: string;
  span?: "wide";
  tone?: "burnt";
  series: Series[];
};

const COLORS = {
  accent: "#5aa2e0",
  positive: "#3fb56b",
  negative: "#e0616b",
  warn: "#e08a4f",
  muted: "#b4bcc6",
  burnt: "#e0a82e",
} as const;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const fraction = value / exp;
  const steps = [1, 2, 4, 5, 6, 8, 10];
  const nice = steps.find((step) => step >= fraction - 1e-9) ?? 10;
  return nice * exp;
}

function chartSpecs(matches: MatchStats[]): ChartSpec[] {
  return [
    {
      id: "pass-volume",
      title: "Pass volume",
      series: [
        {
          id: "under",
          label: "Under pressure",
          color: COLORS.warn,
          values: matches.map((match) => match.passesUnderPressure.underPressure),
        },
        {
          id: "clear",
          label: "Not under pressure",
          color: COLORS.accent,
          values: matches.map((match) => match.passesUnderPressure.notUnderPressure),
        },
      ],
    },
    {
      id: "possessions",
      title: "Possessions",
      series: [
        {
          id: "total",
          label: "Total",
          color: COLORS.accent,
          values: matches.map((match) => match.possessions.total),
        },
      ],
    },
    {
      id: "pressure-quality",
      title: "Passes under pressure",
      series: [
        {
          id: "good",
          label: "Good",
          color: COLORS.positive,
          values: matches.map((match) => match.passResults.underPressure.progressive),
        },
        {
          id: "neutral",
          label: "Neutral",
          color: COLORS.muted,
          values: matches.map((match) => match.passResults.underPressure.neutral),
        },
        {
          id: "bad",
          label: "Bad",
          color: COLORS.negative,
          values: matches.map((match) => match.passResults.underPressure.lost),
        },
      ],
    },
    {
      id: "clear-quality",
      title: "Passes not under pressure",
      series: [
        {
          id: "good",
          label: "Good",
          color: COLORS.positive,
          values: matches.map((match) => match.passResults.notUnderPressure.progressive),
        },
        {
          id: "neutral",
          label: "Neutral",
          color: COLORS.muted,
          values: matches.map((match) => match.passResults.notUnderPressure.neutral),
        },
        {
          id: "bad",
          label: "Bad",
          color: COLORS.negative,
          values: matches.map((match) => match.passResults.notUnderPressure.lost),
        },
      ],
    },
    {
      id: "possession-losses",
      title: "Lost balls, wrong passes, lost plays",
      span: "wide",
      tone: "burnt",
      series: [
        {
          id: "lost-balls",
          label: "Lost balls",
          color: COLORS.negative,
          values: matches.map((match) => match.possessions.lostBalls),
        },
        {
          id: "wrong",
          label: "Wrong passes",
          color: COLORS.warn,
          values: matches.map((match) => match.possessions.wrongPasses),
        },
        {
          id: "lost-plays",
          label: "Lost plays",
          color: COLORS.burnt,
          values: matches.map((match) => match.possessions.lostPlays),
        },
      ],
    },
  ];
}

function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function LineChart({ labels, spec }: { labels: string[]; spec: ChartSpec }) {
  const peak = Math.max(
    1,
    ...spec.series.flatMap((series) => series.values.filter((value): value is number => value != null)),
  );
  const yMax = niceMax(peak);
  const yPad = 8;
  const yAt = (value: number) => yPad + (100 - yPad * 2) * (1 - value / yMax);
  const xAt = (index: number, seriesIndex: number) => {
    const center = ((index + 0.5) / Math.max(labels.length, 1)) * 100;
    const spread = spec.series.length <= 1 ? 0 : 1.8;
    return center + (seriesIndex - (spec.series.length - 1) / 2) * spread;
  };
  const ticks = [yMax, yMax / 2, 0];

  return (
    <article className={`trend-card trend-card--${spec.tone ?? "accent"}${spec.span === "wide" ? " trend-card--wide" : ""}`}>
      <header className="trend-card__head">
        <h3 className="trend-card__title">{spec.title}</h3>
        {spec.note ? <p className="trend-card__note">{spec.note}</p> : null}
      </header>
      <div className="trend-plot">
        <div className="trend-plot__y" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} style={{ top: `${yAt(tick)}%` }}>
              {formatTick(tick)}
            </span>
          ))}
        </div>
        <div className="trend-plot__main">
          <div className="trend-plot__canvas">
            <svg className="trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={spec.title}>
              {ticks.map((tick) => (
                <line
                  key={tick}
                  x1={0}
                  x2={100}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                  className={`trend-chart__grid${tick === 0 ? " trend-chart__grid--base" : ""}`}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {spec.series.map((series, seriesIndex) => {
                const runs: string[] = [];
                let current = "";
                series.values.forEach((value, index) => {
                  if (value == null) {
                    if (current) runs.push(current);
                    current = "";
                    return;
                  }
                  const command = current ? "L" : "M";
                  current += `${command}${xAt(index, seriesIndex)},${yAt(value)} `;
                });
                if (current) runs.push(current);

                return runs.map((d, run) => (
                  <path
                    key={`${series.id}-${run}`}
                    d={d}
                    fill="none"
                    stroke={series.color}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ));
              })}
            </svg>
            {spec.series.map((series, seriesIndex) =>
              series.values.map((value, index) =>
                value == null ? null : (
                  <span
                    key={`${series.id}-${index}`}
                    className="trend-dot"
                    style={{ left: `${xAt(index, seriesIndex)}%`, top: `${yAt(value)}%`, background: series.color }}
                    title={`${series.label}, ${labels[index]}: ${value}`}
                  />
                ),
              ),
            )}
          </div>
        </div>
      </div>
      <div className="trend-table-wrap">
        <table className="trend-table">
          <thead>
            <tr>
              <th scope="col">Metric</th>
              {labels.map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.series.map((series) => (
              <tr key={series.id}>
                <th scope="row">
                  <span className="trend-table__metric">
                    <span className="trend-legend__swatch" style={{ background: series.color }} />
                    {series.label}
                  </span>
                </th>
                {series.values.map((value, index) => (
                  <td key={`${series.id}-${labels[index]}`}>{value == null ? "—" : value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

const AXIS_LABEL: Record<string, string> = {
  "Club Ohio": "Ohio",
  "Chicago Fire": "Chicago",
  "Columbus Crew": "Columbus",
};

export function TrendCharts({ matches }: { matches: MatchStats[] }) {
  const labels = matches.map((match) => AXIS_LABEL[match.shortLabel] ?? match.shortLabel);
  const charts = chartSpecs(matches);

  return (
    <section className="trends" aria-label="Continuous evaluation">
      <div className="trends__intro">
        <h2 className="board__heading">Continuous evaluation</h2>
        <p className="trends__lead">
          Line charts follow the metrics recorded in all three matches: Club Ohio, Chicago Fire, and Columbus Crew. Each chart uses its own scale.
        </p>
      </div>
      <div className="trend-grid">
        {charts.map((spec) => (
          <LineChart key={spec.id} labels={labels} spec={spec} />
        ))}
      </div>
    </section>
  );
}
