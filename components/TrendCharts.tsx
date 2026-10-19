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
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
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
      id: "possession-losses",
      title: "Lost balls, wrong passes, lost plays",
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

function LineChart({ labels, spec }: { labels: string[]; spec: ChartSpec }) {
  const width = 640;
  const height = 240;
  const pad = { top: 18, right: 12, bottom: 32, left: 36 };
  const peak = Math.max(
    1,
    ...spec.series.flatMap((series) => series.values.filter((value): value is number => value != null)),
  );
  const yMax = niceMax(peak);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const xAt = (index: number) =>
    labels.length <= 1 ? pad.left + innerW / 2 : pad.left + (index / (labels.length - 1)) * innerW;
  const yAt = (value: number) => pad.top + innerH - (value / yMax) * innerH;
  const ticks = [0, yMax / 2, yMax];

  return (
    <article className="trend-card">
      <header className="trend-card__head">
        <h3 className="trend-card__title">{spec.title}</h3>
        {spec.note ? <p className="trend-card__note">{spec.note}</p> : null}
      </header>
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={spec.title}>
        {ticks.map((tick) => {
          const y = yAt(tick);
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="trend-chart__grid" />
              <text x={pad.left - 8} y={y + 4} className="trend-chart__tick" textAnchor="end">
                {Number.isInteger(tick) ? tick : tick.toFixed(1)}
              </text>
            </g>
          );
        })}
        {spec.series.map((series) => {
          const runs: string[] = [];
          let current = "";
          series.values.forEach((value, index) => {
            if (value == null) {
              if (current) runs.push(current);
              current = "";
              return;
            }
            const command = current ? "L" : "M";
            current += `${command}${xAt(index)},${yAt(value)} `;
          });
          if (current) runs.push(current);

          return (
            <g key={series.id}>
              {runs.map((d) => (
                <path key={d} d={d} fill="none" stroke={series.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              ))}
              {series.values.map((value, index) =>
                value == null ? null : (
                  <circle key={`${series.id}-${index}`} cx={xAt(index)} cy={yAt(value)} r="4" fill={series.color}>
                    <title>{`${series.label}, ${labels[index]}: ${value}`}</title>
                  </circle>
                ),
              )}
            </g>
          );
        })}
        {labels.map((label, index) => (
          <text key={label} x={xAt(index)} y={height - 8} className="trend-chart__label" textAnchor="middle">
            {label}
          </text>
        ))}
      </svg>
      <ul className="trend-legend">
        {spec.series.map((series) => (
          <li key={series.id}>
            <span className="trend-legend__swatch" style={{ background: series.color }} />
            {series.label}
          </li>
        ))}
      </ul>
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
                <th scope="row">{series.label}</th>
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

export function TrendCharts({ matches }: { matches: MatchStats[] }) {
  const labels = matches.map((match) => match.shortLabel);
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
