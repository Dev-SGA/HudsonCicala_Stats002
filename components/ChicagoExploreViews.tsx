import { CountLine } from "@/components/CountLine";
import { clipUrl, type MatchStats, type MatchSummary } from "@/lib/stats";

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
        <span className="possession-stat__value">{value}</span>
      )}
      {detail ? <span className="possession-stat__detail">{detail}</span> : null}
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
      href: clipUrl(videos, "Off. Duels Lost", "Off Duels Lost"),
    },
    {
      label: "Inaccurate Pass",
      value: parts.inaccuratePasses,
      tone: "yellow-mid",
      href: clipUrl(videos, "Inaccurate Passes", "Inaccurate Pass"),
    },
  ];
  const turnoverRows = [
    { label: "Turnover Duel", value: parts.duelTurnover, tone: "yellow-deep" },
    { label: "Turnover Pass", value: parts.passTurnover, tone: "yellow-mid" },
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
      />
      <PossessionStat
        label="Lost plays"
        value={parts.lostPlays}
        detail={`${percent(parts.lostPlays, parts.total)}% of possessions`}
        tone="lost"
      />
      <PossessionStat
        label="Turnovers"
        value={parts.turnover}
        detail={`${percent(parts.turnover, parts.total)}% of possessions`}
        tone="turnover"
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
  rows: { label: string; value: number; tone: string; href?: string }[];
  scale: number;
}) {
  return (
    <div className="possession-chart">
      <h3 className="possession-chart__title">{title}</h3>
      <ul className="possession-rows">
        {rows.map((row) => (
          <li key={row.label} className="possession-row">
            <span className="possession-row__label">
              <ClipLabel label={row.label} href={row.href} />
            </span>
            <span className="possession-row__track">
              <span className={`possession-row__fill possession-row__fill--${row.tone}`} style={{ width: `${percent(row.value, scale)}%` }} />
            </span>
            <strong>{row.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClipLabel({ label, href }: { label: string; href?: string }) {
  if (!href) return <span>{label}</span>;
  return (
    <a className="clip-link" href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

function StatsSplit({
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  primaryTone,
  secondaryTone,
  primaryHref,
  secondaryHref,
  showShare = true,
}: {
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryTone: Tone;
  secondaryTone: Tone;
  primaryHref?: string;
  secondaryHref?: string;
  showShare?: boolean;
}) {
  const total = primary + secondary;
  const figure = (value: number) => (showShare ? `${value} · ${percent(value, total)}%` : String(value));

  return (
    <div className="stats-viz">
      <ExploreBar
        primary={primary}
        secondary={secondary}
        primaryTone={primaryTone}
        secondaryTone={secondaryTone}
        label={`${primaryLabel} ${primary}. ${secondaryLabel} ${secondary}.`}
      />
      <ul className="stats-viz__legend">
        <li>
          <span className={`legend__dot legend__dot--${primaryTone}`} />
          <ClipLabel label={primaryLabel} href={primaryHref} />
          <strong>{figure(primary)}</strong>
        </li>
        <li>
          <span className={`legend__dot legend__dot--${secondaryTone}`} />
          <ClipLabel label={secondaryLabel} href={secondaryHref} />
          <strong>{figure(secondary)}</strong>
        </li>
      </ul>
    </div>
  );
}

function StatsFigure({
  label,
  value,
  unit,
  games,
  rate,
}: {
  label: string;
  value: number;
  unit?: string;
  games?: number;
  rate?: boolean;
}) {
  return (
    <div className={`stats-figure${rate ? " stats-figure--rate" : ""}`}>
      <span className="stats-figure__label">{label}</span>
      {games && unit ? (
        <CountLine value={value} unit={unit} games={games} />
      ) : (
        <span className="stats-figure__value">{rate ? `${value}%` : value}</span>
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
  rateLabel,
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  primaryTone,
  secondaryTone,
  primaryHref,
  secondaryHref,
  showShare = true,
}: {
  title: string;
  total: number;
  totalLabel: string;
  totalUnit: string;
  games?: number;
  rate: number;
  rateLabel: string;
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryTone: Tone;
  secondaryTone: Tone;
  primaryHref?: string;
  secondaryHref?: string;
  showShare?: boolean;
}) {
  return (
    <section className="stats-topic">
      <h3 className="stats-topic__title">{title}</h3>
      <div className="stats-topic__panel">
        <StatsFigure label={totalLabel} value={total} unit={totalUnit} games={games} />
        <StatsFigure label={rateLabel} value={rate} rate />
        <StatsSplit
          primary={primary}
          secondary={secondary}
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
          primaryTone={primaryTone}
          secondaryTone={secondaryTone}
          primaryHref={primaryHref}
          secondaryHref={secondaryHref}
          showShare={showShare}
        />
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
        rate={summary.accuracy}
        rateLabel="Accurate"
        primary={summary.accurate}
        secondary={summary.inaccurate}
        primaryLabel="Accurate"
        secondaryLabel="Inaccurate"
        primaryTone="positive"
        secondaryTone="muted"
        showShare={false}
      />
      <StatsRateTopic
        title="Offensive Duels"
        total={offensiveTotal}
        totalLabel="Total duels"
        totalUnit="duels"
        games={games}
        rate={summary.offensiveWinRate}
        rateLabel="Won rate"
        primary={summary.offensiveWon}
        secondary={summary.offensiveLost}
        primaryLabel="Won"
        secondaryLabel="Lost"
        primaryTone="positive"
        secondaryTone="muted"
        primaryHref={clipUrl(videos, "Off. Duels Won", "Off Duels Won")}
        showShare={false}
      />
      <StatsRateTopic
        title="Defensive Duels"
        total={defensiveTotal}
        totalLabel="Total duels"
        totalUnit="duels"
        games={games}
        rate={summary.defensiveWinRate}
        rateLabel="Won rate"
        primary={summary.defensiveWon}
        secondary={summary.defensiveLost}
        primaryLabel="Won"
        secondaryLabel="Lost"
        primaryTone="positive"
        secondaryTone="muted"
        primaryHref={clipUrl(videos, "Def. Duels Won", "Def Duels Won")}
        secondaryHref={clipUrl(videos, "Def. Duels Lost", "Def Duels Lost")}
        showShare={false}
      />
      <section className="stats-topic">
        <h3 className="stats-topic__title">Tackles</h3>
        <div className="stats-topic__panel stats-topic__panel--pair">
          <StatsFigure label="Total tackles" value={summary.regains} unit="tackles" games={games} />
          <StatsSplit
            primary={summary.interceptions}
            secondary={summary.recoveries}
            primaryLabel="Interceptions"
            secondaryLabel="Recoveries"
            primaryTone="accent"
            secondaryTone="recover"
            primaryHref={clipUrl(videos, "Interceptions")}
            secondaryHref={clipUrl(videos, "Recoveries")}
          />
        </div>
      </section>
    </div>
  );
}
