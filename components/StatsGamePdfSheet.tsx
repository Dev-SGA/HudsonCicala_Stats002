import { BRAND } from "@/lib/brand";
import { matchSummary, type GameStats, type PassResultBreakdown } from "@/lib/stats";

type StatsGamePdfSheetProps = {
  stats: GameStats;
  photoUrl: string;
  logoUrl: string;
};

type Tone = "blue" | "red" | "burnt" | "warn" | "pass-progressive" | "pass-neutral" | "pass-lost";

function pct(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function StatTiles({
  items,
}: {
  items: { label: string; value: number; tone?: Tone; detail?: string; emphasizeDetail?: boolean }[];
}) {
  return (
    <ul className="spdf-stats">
      {items.map((item) => (
        <li key={item.label} className={`spdf-stat${item.emphasizeDetail ? " spdf-stat--lost-plays" : ""}`}>
          <span className={`spdf-stat__value${item.tone ? ` spdf-stat__value--${item.tone}` : ""}`}>{item.value}</span>
          <span className="spdf-stat__label">{item.label}</span>
          {item.detail ? (
            <span className={`spdf-stat__detail${item.emphasizeDetail ? " spdf-stat__detail--lost-plays" : ""}`}>{item.detail}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function PassResultPanel({ title, breakdown }: { title: string; breakdown: PassResultBreakdown }) {
  const total = breakdown.progressive + breakdown.neutral + breakdown.lost;
  const segments = [
    { value: breakdown.progressive, tone: "pass-progressive" as const },
    { value: breakdown.neutral, tone: "pass-neutral" as const },
    { value: breakdown.lost, tone: "pass-lost" as const },
  ];

  return (
    <div className="spdf-pass-panel">
      <div className="spdf-pass-panel__head">
        <p className="spdf-pass-panel__title">{title}</p>
        <span className="spdf-pass-panel__total">{total} passes</span>
      </div>
      <div className="spdf-pass-panel__track">
        {segments.map((segment, index) =>
          segment.value > 0 ? (
            <span
              key={index}
              className={`spdf-pass-panel__seg spdf-pass-panel__seg--${segment.tone}`}
              style={{ width: `${pct(segment.value, total)}%` }}
            />
          ) : null,
        )}
      </div>
      <ul className="spdf-pass-panel__legend">
        <li>
          <span className="spdf-pass-panel__dot spdf-pass-panel__dot--pass-progressive" />
          <span className="spdf-pass-panel__legend-label">Progressive</span>
          <strong>
            {breakdown.progressive} · {pct(breakdown.progressive, total)}%
          </strong>
        </li>
        <li>
          <span className="spdf-pass-panel__dot spdf-pass-panel__dot--pass-neutral" />
          <span className="spdf-pass-panel__legend-label">Neutral</span>
          <strong>
            {breakdown.neutral} · {pct(breakdown.neutral, total)}%
          </strong>
        </li>
        <li>
          <span className="spdf-pass-panel__dot spdf-pass-panel__dot--pass-lost" />
          <span className="spdf-pass-panel__legend-label">Lost</span>
          <strong>
            {breakdown.lost} · {pct(breakdown.lost, total)}%
          </strong>
        </li>
      </ul>
    </div>
  );
}

function PdfSection({
  title,
  kpi,
  unit,
  children,
  footer,
  size = "md",
}: {
  title: string;
  kpi: number;
  unit: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <section className={`spdf-section spdf-section--build-up spdf-section--${size}`}>
      <div className="spdf-section__top">
        <p className="spdf-section__phase">Build-Up</p>
        <h3 className="spdf-section__title">{title}</h3>
      </div>
      <div className="spdf-section__content">
        <div className="spdf-section__kpi">
          <span className="spdf-section__value">{kpi}</span>
          <span className="spdf-section__unit">{unit}</span>
        </div>
        <div className="spdf-section__panel">{children}</div>
      </div>
      {footer ? <div className="spdf-section__footer">{footer}</div> : null}
    </section>
  );
}

function PdfSide({ photoUrl, logoUrl, name, club }: { photoUrl: string; logoUrl: string; name: string; club: string }) {
  return (
    <aside className="spdf-side">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt="" className="spdf-side__logo" />
      <div className="spdf-side__photo" data-pdf-bg={photoUrl} style={{ backgroundImage: `url(${photoUrl})` }} />
      <div className="spdf-side__identity">
        <p className="spdf-side__label">Athlete</p>
        <h2 className="spdf-side__name">{name}</h2>
        <p className="spdf-side__club">{club}</p>
      </div>
      <p className="spdf-side__slogan">{BRAND.slogan}</p>
    </aside>
  );
}

function SummaryPdfPage({
  stats,
  photoUrl,
  logoUrl,
}: {
  stats: GameStats;
  photoUrl: string;
  logoUrl: string;
}) {
  const summary = matchSummary(stats);
  if (!summary) return null;
  const groups: { title: string; pair?: boolean; items: { label: string; value: string }[] }[] = [
    {
      title: "General passing",
      pair: true,
      items: [
        { label: "Total passes", value: String(summary.totalPasses) },
        { label: "Accuracy", value: `${summary.accuracy}%` },
      ],
    },
    {
      title: "Offensive duels",
      items: [
        { label: "Won", value: String(summary.offensiveWon) },
        { label: "Lost", value: String(summary.offensiveLost) },
        { label: "% won", value: `${summary.offensiveWinRate}%` },
      ],
    },
    {
      title: "Defensive duels",
      items: [
        { label: "Won", value: String(summary.defensiveWon) },
        { label: "Lost", value: String(summary.defensiveLost) },
        { label: "% won", value: `${summary.defensiveWinRate}%` },
      ],
    },
    {
      title: "Interceptions & recoveries",
      items: [
        { label: "Total", value: String(summary.regains) },
        { label: "Interceptions", value: String(summary.interceptions) },
        { label: "Recoveries", value: String(summary.recoveries) },
      ],
    },
  ];

  return (
    <article className="stats-pdf" aria-hidden="true">
      <PdfSide photoUrl={photoUrl} logoUrl={logoUrl} name={stats.player.name} club={stats.player.club} />
      <div className="spdf-main">
        <header className="spdf-head">
          <div>
            <p className="spdf-head__eyebrow">{BRAND.legal}</p>
            <h1 className="spdf-head__title">Stats</h1>
          </div>
          <div className="spdf-head__meta">
            <span>{stats.meta.subtitle}</span>
          </div>
        </header>
        <div className="spdf-duel-stack">
          {groups.map((group) => (
            <section key={group.title} className="spdf-duel-group">
              <h2 className="spdf-duel-group__title">{group.title}</h2>
              <ul className={`spdf-duel-grid${group.pair ? " spdf-duel-grid--pair" : ""}`}>
                {group.items.map((item) => (
                  <li key={item.label} className="spdf-duel">
                    <span className="spdf-duel__value">{item.value}</span>
                    <span className="spdf-duel__label">{item.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <footer className="spdf-foot">
          <span>{BRAND.name}</span>
          <span>
            {stats.player.name} · {stats.meta.subtitle}
          </span>
        </footer>
      </div>
    </article>
  );
}

export function StatsGamePdfSheet({ stats, photoUrl, logoUrl }: StatsGamePdfSheetProps) {
  const { player, meta, passesUnderPressure, passResults, possessions } = stats;
  const passTotal = passesUnderPressure.total;

  return (
    <>
    <article className="stats-pdf" aria-hidden="true">
      <PdfSide photoUrl={photoUrl} logoUrl={logoUrl} name={player.name} club={player.club} />

      <div className="spdf-main">
        <header className="spdf-head">
          <div>
            <p className="spdf-head__eyebrow">{BRAND.legal}</p>
            <h1 className="spdf-head__title">{meta.title}</h1>
          </div>
          <div className="spdf-head__meta">
            <span>{meta.subtitle}</span>
          </div>
        </header>

        <div className="spdf-stack">
          <section className="spdf-section spdf-section--build-up spdf-section--pressure">
            <div className="spdf-section__top">
              <p className="spdf-section__phase">Build-Up</p>
              <h3 className="spdf-section__title">Passes Under Pressure vs Not</h3>
            </div>
            <div className="spdf-pressure">
              <div className="spdf-pressure__total">
                <span className="spdf-pressure__kicker">Total passes</span>
                <span className="spdf-pressure__value">{passTotal}</span>
                <span className="spdf-pressure__caption">Passes tracked in the match</span>
              </div>
              <div className="spdf-pressure__context">
                <p className="spdf-pressure__kicker">Pressure context</p>
                <p className="spdf-pressure__headline">
                  {passesUnderPressure.underPressure} under pressure · {passesUnderPressure.notUnderPressure} not under
                  pressure
                </p>
                <div className="spdf-pressure__track">
                  <span
                    className="spdf-pressure__seg spdf-pressure__seg--warn"
                    style={{ width: `${pct(passesUnderPressure.underPressure, passTotal)}%` }}
                  />
                  <span
                    className="spdf-pressure__seg spdf-pressure__seg--blue"
                    style={{ width: `${pct(passesUnderPressure.notUnderPressure, passTotal)}%` }}
                  />
                </div>
                <ul className="spdf-pressure__legend">
                  <li>
                    <span className="spdf-pressure__dot spdf-pressure__dot--warn" />
                    <span>Under pressure</span>
                    <strong>
                      {passesUnderPressure.underPressure} · {pct(passesUnderPressure.underPressure, passTotal)}%
                    </strong>
                  </li>
                  <li>
                    <span className="spdf-pressure__dot spdf-pressure__dot--blue" />
                    <span>Not under pressure</span>
                    <strong>
                      {passesUnderPressure.notUnderPressure} · {pct(passesUnderPressure.notUnderPressure, passTotal)}%
                    </strong>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <PdfSection title="Pass Results" kpi={passTotal} unit="Passes" size="lg">
            <div className="spdf-pass-row">
              <PassResultPanel title="Under pressure" breakdown={passResults.underPressure} />
              <PassResultPanel title="Not under pressure" breakdown={passResults.notUnderPressure} />
            </div>
          </PdfSection>

          <PdfSection title="Possessions" kpi={possessions.total} unit="Total possessions">
            <StatTiles
              items={[
                {
                  label: "Lost balls",
                  value: possessions.lostBalls,
                  tone: "red",
                  detail: `${pct(possessions.lostBalls, possessions.total)}%`,
                },
                {
                  label: "Wrong passes",
                  value: possessions.wrongPasses,
                  tone: "warn",
                  detail: `${pct(possessions.wrongPasses, possessions.total)}%`,
                },
                {
                  label: "Lost plays",
                  value: possessions.lostPlays,
                  tone: "burnt",
                  detail: `${pct(possessions.lostPlays, possessions.total)}%`,
                  emphasizeDetail: true,
                },
              ]}
            />
          </PdfSection>

        </div>

        <footer className="spdf-foot">
          <span>{BRAND.name}</span>
          <span>
            {player.name} · {meta.subtitle}
          </span>
        </footer>
      </div>
    </article>
    <SummaryPdfPage stats={stats} photoUrl={photoUrl} logoUrl={logoUrl} />
    </>
  );
}
