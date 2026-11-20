import { CountLine } from "@/components/CountLine";
import { clipRef, formatCount, type ClipRef, type MatchStats, type MatchSummary } from "@/lib/stats";

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
    inaccuratePasses: possessions.wrongPasses,
    passTurnover: possessions.passTurnover ?? 0,
    duelTurnover: possessions.duelTurnover ?? 0,
    turnover: (possessions.passTurnover ?? 0) + (possessions.duelTurnover ?? 0),
  };
}

function PossessionStat({
  label,
  value,
  detail,
  tone,
  games,
  unit,
}: {
  label: string;
  value: number;
  detail?: string;
  tone?: "retained" | "lost" | "turnover";
  games?: number;
  unit?: string;
}) {
  return (
    <div className={`possession-stat${tone ? ` possession-stat--${tone}` : ""}`}>
      <span className="possession-stat__label">{label}</span>
      {games && unit ? (
        <CountLine value={value} unit={unit} games={games} />
      ) : (
        <span className="possession-stat__value">{formatCount(value)}</span>
      )}
      {detail ? <span className="possession-stat__detail">{detail}</span> : null}
    </div>
  );
}

export function PossessionBoard({
  possessions,
  scopeLabel = "match",
  games,
  videos,
}: {
  possessions: PossessionSource;
  scopeLabel?: string;
  games?: number;
  videos?: MatchStats["videos"];
}) {
  const parts = possessionParts(possessions);
  const lostScale = Math.max(parts.dispossessed + parts.inaccuratePasses, 1);
  const turnoverScale = Math.max(parts.duelTurnover + parts.passTurnover, 1);
  const lostRows = [
    {
      label: "Lost Duels",
      value: parts.dispossessed,
      tone: "yellow-deep",
      clip: clipRef(videos, "Off. Duels Lost", "Off Duels Lost"),
    },
    {
      label: "Inaccurate Pass",
      value: parts.inaccuratePasses,
      tone: "yellow-mid",
      clip: clipRef(videos, "Inaccurate Passes", "Inaccurate Pass"),
    },
  ];
  const turnoverRows = [
    {
      label: "Turnover Duel",
      value: parts.duelTurnover,
      tone: "yellow-deep",
      clip: clipRef(videos, "Turnover Duels", "Turnover Duel"),
    },
    {
      label: "Turnover Pass",
      value: parts.passTurnover,
      tone: "yellow-mid",
      clip: clipRef(videos, "Turnover Passes", "Turnover Pass"),
    },
  ];

  return (
    <div className="possessions-board">
      <PossessionStat
        label="Total possessions"
        value={parts.total}
        detail={`Ball possessions in the ${scopeLabel}`}
        games={games}
        unit="possessions"
      />
      <PossessionStat
        label="Retained"
        value={parts.retained}
        detail={`${percent(parts.retained, parts.total)}% of possessions`}
        tone="retained"
      />
      <PossessionStat
        label="Lost plays"
        value={parts.lostPlays}
        detail={`${percent(parts.lostPlays, parts.total)}% of possessions`}
        tone="lost"
        games={games}
        unit="lost plays"
      />
      <PossessionStat
        label="Turnovers"
        value={parts.turnover}
        detail={`${percent(parts.turnover, parts.total)}% of possessions`}
        tone="turnover"
        games={games}
        unit="turnovers"
      />
      <div className="possession-charts">
        <PossessionBreakdown title="Lost play breakdown" rows={lostRows} scale={lostScale} />
        <PossessionBreakdown title="Turnover breakdown" rows={turnoverRows} scale={turnoverScale} />
      </div>
    </div>
  );
}

function PossessionBreakdown({
  title,
  rows,
  scale,
}: {
  title: string;
  rows: { label: string; value: number; tone: string; clip?: ClipRef }[];
  scale: number;
}) {
  return (
    <div className="possession-chart">
      <h3 className="possession-chart__title">{title}</h3>
      <ul className="possession-rows">
        {rows.map((row) => (
          <li key={row.label} className="possession-row">
            <span className="possession-row__label">
              <ClipLabel label={row.label} clip={row.clip} />
            </span>
            <span className="possession-row__track">
              <span className={`possession-row__fill possession-row__fill--${row.tone}`} style={{ width: `${percent(row.value, scale)}%` }} />
            </span>
            <strong>{formatCount(row.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClipLabel({ label, clip }: { label: string; clip?: ClipRef }) {
  if (clip?.href) {
    return (
      <a className="clip-link" href={clip.href} target="_blank" rel="noreferrer">
        {label}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/play-icon.png" alt="" className="play-icon" width={14} height={14} />
      </a>
    );
  }
  return (
    <span>
      {label}
      {clip?.hasClip ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/brand/play-icon.png" alt="" className="play-icon play-icon--pending" width={14} height={14} />
      ) : null}
    </span>
  );
}

function ClipIcon({ clip }: { clip?: ClipRef }) {
  if (!clip?.hasClip) return null;
  const icon = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/play-icon.png" alt="" className="play-icon" width={14} height={14} />
  );
  if (!clip.href) return <span className="clip-icon">{icon}</span>;
  return (
    <a className="clip-icon" href={clip.href} target="_blank" rel="noreferrer" aria-label="Open video clip">
      {icon}
    </a>
  );
}

/** Circular gauge for a 0-100 share. */
function RateRing({ value, tone }: { value: number; tone: Tone }) {
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(value, 100)) / 100) * circumference;
  return (
    <svg viewBox="0 0 64 64" className={`rate-ring rate-ring--${tone}`} aria-hidden="true">
      <circle cx={32} cy={32} r={radius} className="rate-ring__track" />
      <circle
        cx={32}
        cy={32}
        r={radius}
        className="rate-ring__fill"
        strokeDasharray={`${filled} ${circumference}`}
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}

function RateFigure({
  label,
  rate,
  tone,
  caption,
}: {
  label: string;
  rate: number;
  tone: Tone;
  caption?: string;
}) {
  return (
    <div className={`stats-figure stats-figure--rate stats-figure--${tone}`}>
      <span className="stats-figure__label">{label}</span>
      <div className="stats-figure__rate">
        <RateRing value={rate} tone={tone} />
        <div className="stats-figure__rate-text">
          <span className="stats-figure__value">{rate}%</span>
          {caption ? <span className="stats-figure__caption">{caption}</span> : null}
        </div>
      </div>
    </div>
  );
}

export type DuoSegment = {
  label: string;
  value: number;
  tone: string;
  clip?: ClipRef;
  /** Extra context rendered under the value, e.g. "of 6 inaccurate" for a subset. */
  hint?: string;
  /** Subset of another segment — styled as a nested chip. */
  nested?: boolean;
};

/** Two-way outcome meter with in-bar shares and chips below. */
function DuoSplit({ segments, label }: { segments: DuoSegment[]; label: string }) {
  const total = segments.filter((segment) => !segment.nested).reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="stats-viz">
      <div
        className="meter meter--duo"
        role="img"
        aria-label={`${label}: ${segments.map((segment) => `${segment.label} ${segment.value}`).join(", ")}`}
      >
        {total === 0 ? (
          <span className="meter__seg meter__seg--muted" style={{ flex: "1 1 0" }} />
        ) : (
          segments
            .filter((segment) => segment.value > 0)
            .map((segment) => {
              const share = percent(segment.value, total);
              return (
                <span
                  key={segment.label}
                  className={`meter__seg meter__seg--${segment.tone}`}
                  style={{ flex: `${segment.value} 1 0` }}
                >
                  {share >= 14 ? <span className="meter__pct">{share}%</span> : null}
                </span>
              );
            })
        )}
      </div>
      <ul className="outcome-grid">
        {segments.map((segment) => (
          <li
            key={segment.label}
            className={`outcome-chip outcome-chip--${segment.tone}${segment.value === 0 ? " is-empty" : ""}${
              segment.nested ? " outcome-chip--nested" : ""
            }`}
          >
            <span className="outcome-chip__label">
              <span className={`legend__dot legend__dot--${segment.tone}`} />
              <ClipLabel label={segment.label} clip={segment.clip} />
            </span>
            <span className="outcome-chip__value">
              {formatCount(segment.value)}
              <small>{segment.hint ?? `${percent(segment.value, total)}%`}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatsFigure({
  label,
  value,
  unit,
  games,
  clip,
}: {
  label: string;
  value: number;
  unit?: string;
  games?: number;
  clip?: ClipRef;
}) {
  return (
    <div className="stats-figure">
      <span className="stats-figure__label">
        <ClipLabel label={label} clip={clip} />
      </span>
      {games && unit ? (
        <CountLine value={value} unit={unit} games={games} />
      ) : (
        <span className="stats-figure__value">{formatCount(value)}</span>
      )}
    </div>
  );
}

function StatsRateTopic({
  title,
  total,
  totalLabel,
  totalUnit,
  games,
  rate,
  segments,
}: {
  title: string;
  total: number;
  totalLabel: string;
  totalUnit: string;
  games?: number;
  rate: { label: string; value: number; tone: Tone; caption?: string };
  segments: DuoSegment[];
}) {
  return (
    <section className="stats-topic">
      <h3 className="stats-topic__title">{title}</h3>
      <div className="stats-topic__panel">
        <StatsFigure label={totalLabel} value={total} unit={totalUnit} games={games} />
        <RateFigure label={rate.label} rate={rate.value} tone={rate.tone} caption={rate.caption} />
        <DuoSplit segments={segments} label={`${title} breakdown`} />
      </div>
    </section>
  );
}

export function StatsHeroSideboard({
  summary,
  games,
  videos,
}: {
  summary: MatchSummary;
  games?: number;
  videos?: MatchStats["videos"];
}) {
  const offensiveTotal = summary.offensiveWon + summary.offensiveLost;
  const defensiveTotal = summary.defensiveWon + summary.defensiveLost;

  return (
    <div className="stats-board-v2">
      <StatsRateTopic
        title="General Passing"
        total={summary.totalPasses}
        totalLabel="Total passes"
        totalUnit="passes"
        games={games}
        rate={{
          label: "Accuracy",
          value: summary.accuracy,
          tone: "positive",
          caption: `${formatCount(summary.accurate)} of ${formatCount(summary.totalPasses)} accurate`,
        }}
        segments={[
          {
            label: "Accurate",
            value: summary.accurate,
            tone: "positive",
            clip: clipRef(videos, "Accurate Passes"),
          },
          {
            label: "Inaccurate",
            value: summary.inaccurate,
            tone: "negative",
            clip: clipRef(videos, "Inaccurate Passes", "Inaccurate Pass"),
          },
        ]}
      />
      <StatsRateTopic
        title="Offensive Duels"
        total={offensiveTotal}
        totalLabel="Total duels"
        totalUnit="duels"
        games={games}
        rate={{
          label: "Win rate",
          value: summary.offensiveWinRate,
          tone: "positive",
          caption: `${formatCount(summary.offensiveWon)} of ${formatCount(offensiveTotal)} won`,
        }}
        segments={[
          {
            label: "Won",
            value: summary.offensiveWon,
            tone: "positive",
            clip: clipRef(videos, "Off. Duels Won", "Off Duels Won"),
          },
          {
            label: "Lost",
            value: summary.offensiveLost,
            tone: "negative",
            clip: clipRef(videos, "Off. Duels Lost", "Off Duels Lost"),
          },
        ]}
      />
      <StatsRateTopic
        title="Defensive Duels"
        total={defensiveTotal}
        totalLabel="Total duels"
        totalUnit="duels"
        games={games}
        rate={{
          label: "Win rate",
          value: summary.defensiveWinRate,
          tone: "positive",
          caption: `${formatCount(summary.defensiveWon)} of ${formatCount(defensiveTotal)} won`,
        }}
        segments={[
          {
            label: "Won",
            value: summary.defensiveWon,
            tone: "positive",
            clip: clipRef(videos, "Def. Duels Won", "Def Duels Won"),
          },
          {
            label: "Lost",
            value: summary.defensiveLost,
            tone: "negative",
            clip: clipRef(videos, "Def. Duels Lost", "Def Duels Lost"),
          },
        ]}
      />
      <section className="stats-topic">
        <h3 className="stats-topic__title">Tackles</h3>
        <div className="stats-topic__panel stats-topic__panel--pair">
          <StatsFigure label="Total tackles" value={summary.regains} unit="tackles" games={games} />
          <DuoSplit
            label="Tackles breakdown"
            segments={[
              {
                label: "Interceptions",
                value: summary.interceptions,
                tone: "accent",
                clip: clipRef(videos, "Interceptions"),
              },
              {
                label: "Recoveries",
                value: summary.recoveries,
                tone: "recover",
                clip: clipRef(videos, "Recoveries"),
              },
            ]}
          />
        </div>
      </section>
      <section className="stats-topic">
        <h3 className="stats-topic__title">Goals &amp; Assists</h3>
        <div className="stats-topic__panel stats-topic__panel--duo">
          <StatsFigure label="Goals" value={summary.goals} unit="goals" games={games} clip={clipRef(videos, "Goals", "Goal")} />
          <StatsFigure label="Assists" value={summary.assists} unit="assists" games={games} clip={clipRef(videos, "Assists", "Assist")} />
        </div>
      </section>
    </div>
  );
}
