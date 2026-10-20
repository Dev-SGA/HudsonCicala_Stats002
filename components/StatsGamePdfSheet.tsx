import { BRAND } from "@/lib/brand";
import { combinePassResults, matchSummary, perGame, type GameStats, type PassResultBreakdown } from "@/lib/stats";

type StatsGamePdfSheetProps = {
  stats: GameStats;
  photoUrl: string;
  logoUrl: string;
  clubLogoUrl: string;
  opponentLogoUrl: string;
};

type PrintTone = "green" | "yellow" | "blue" | "mint" | "grey" | "pass-progressive" | "pass-lost";

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

function PassResultPanel({
  title,
  breakdown,
  compact = false,
}: {
  title: string;
  breakdown: PassResultBreakdown;
  compact?: boolean;
}) {
  const total = breakdown.progressive + breakdown.neutral + breakdown.lost;
  const segments = [
    { label: "Progressive", value: breakdown.progressive, tone: "pass-progressive" as const },
    { label: "Neutral", value: breakdown.neutral, tone: "pass-neutral" as const },
    { label: "Lost", value: breakdown.lost, tone: "pass-lost" as const },
  ].filter((segment) => segment.value > 0);

  return (
    <div className={`spdf-pass-panel${compact ? " spdf-pass-panel--total" : ""}`}>
      <div className="spdf-pass-panel__head">
        <p className="spdf-pass-panel__title">{title}</p>
        <span className="spdf-pass-panel__total">{total} passes</span>
      </div>
      {compact ? (
        <div className="spdf-pass-panel__meter" style={{ gridTemplateColumns: segments.map((segment) => `${segment.value}fr`).join(" ") }}>
          {segments.map((segment) => (
            <span key={segment.label} className={`spdf-pass-panel__seg spdf-pass-panel__seg--${segment.tone}`} />
          ))}
          {segments.map((segment) => (
            <div key={`${segment.label}-caption`} className="spdf-pass-panel__cap">
              <span className="spdf-pass-panel__cap-label">
                <span className={`spdf-pass-panel__dot spdf-pass-panel__dot--${segment.tone}`} />
                {segment.label}
              </span>
              <strong>
                {segment.value} · {pct(segment.value, total)}%
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="spdf-pass-panel__track">
            {segments.map((segment) => (
              <span
                key={segment.label}
                className={`spdf-pass-panel__seg spdf-pass-panel__seg--${segment.tone}`}
                style={{ width: `${pct(segment.value, total)}%` }}
              />
            ))}
          </div>
          <ul className="spdf-pass-panel__legend">
            {segments.map((segment) => (
              <li key={segment.label}>
                <span className={`spdf-pass-panel__dot spdf-pass-panel__dot--${segment.tone}`} />
                <span className="spdf-pass-panel__legend-label">{segment.label}</span>
                <strong>
                  {segment.value} · {pct(segment.value, total)}%
                </strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Total passes: one horizontal bar per category (Progressive, Neutral, Lost). */
function PassResultRowBars({ title, breakdown }: { title: string; breakdown: PassResultBreakdown }) {
  const total = breakdown.progressive + breakdown.neutral + breakdown.lost;
  const rows = [
    { label: "Progressive", value: breakdown.progressive, tone: "pass-progressive" as const },
    { label: "Neutral", value: breakdown.neutral, tone: "pass-neutral" as const },
    { label: "Lost", value: breakdown.lost, tone: "pass-lost" as const },
  ];

  return (
    <div className="spdf-pass-panel spdf-pass-panel--rows">
      <div className="spdf-pass-panel__head">
        <p className="spdf-pass-panel__title">{title}</p>
        <span className="spdf-pass-panel__total">{total} passes</span>
      </div>
      <ul className="spdf-pass-rows">
        {rows.map((row) => (
          <li key={row.label} className="spdf-pass-row-bar">
            <span className="spdf-pass-row-bar__label">{row.label}</span>
            <span className="spdf-pass-row-bar__track">
              <span
                className={`spdf-pass-row-bar__fill spdf-pass-panel__seg--${row.tone}`}
                style={{ width: `${pct(row.value, total)}%` }}
              />
            </span>
            <strong className="spdf-pass-row-bar__value">
              {row.value} · {pct(row.value, total)}%
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

type PdfPossessionSegTone =
  | "retained"
  | "lost-plays"
  | "dispossessed"
  | "wrong-pass"
  | "lost-yellow-deep"
  | "lost-yellow-light";

function PdfPossessionStatCard({
  label,
  value,
  share,
  tone,
}: {
  label: string;
  value: number;
  share: number;
  tone: "retained" | "lost-plays";
}) {
  return (
    <div className={`spdf-possession-stat spdf-possession-stat--${tone}`}>
      <span className="spdf-possession-stat__label">{label}</span>
      <span className="spdf-possession-stat__value">{value}</span>
      <span className="spdf-possession-stat__pct">{share}% of possessions</span>
    </div>
  );
}

function PdfPossessionSplit({
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
  headline?: string;
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryTone: PdfPossessionSegTone;
  secondaryTone: PdfPossessionSegTone;
}) {
  const total = primary + secondary;
  const primaryPct = pct(primary, total);

  return (
    <div className="spdf-pass-panel spdf-possession-split">
      <p className="spdf-pass-panel__title">{title}</p>
      {headline ? <p className="spdf-possession-split__headline">{headline}</p> : null}
      <div className="spdf-pass-panel__track">
        <span className={`spdf-pass-panel__seg spdf-pass-panel__seg--${primaryTone}`} style={{ width: `${primaryPct}%` }} />
        <span
          className={`spdf-pass-panel__seg spdf-pass-panel__seg--${secondaryTone}`}
          style={{ width: `${100 - primaryPct}%` }}
        />
      </div>
      <ul className="spdf-pass-panel__legend">
        <li>
          <span className={`spdf-pass-panel__dot spdf-pass-panel__dot--${primaryTone}`} />
          <span className="spdf-pass-panel__legend-label">{primaryLabel}</span>
          <strong>{primary}</strong>
        </li>
        <li>
          <span className={`spdf-pass-panel__dot spdf-pass-panel__dot--${secondaryTone}`} />
          <span className="spdf-pass-panel__legend-label">{secondaryLabel}</span>
          <strong>{secondary}</strong>
        </li>
      </ul>
    </div>
  );
}

function PdfSection({
  title,
  kpi,
  unit,
  aside,
  children,
  footer,
  size = "md",
  className,
  panelOnly,
}: {
  title: string;
  kpi: number;
  unit: string;
  aside?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
  className?: string;
  panelOnly?: boolean;
}) {
  return (
    <section
      className={`spdf-section spdf-section--build-up spdf-section--${size}${panelOnly ? " spdf-section--panel-only" : ""}${className ? ` ${className}` : ""}`}
    >
      <div className="spdf-section__top">
        <p className="spdf-section__phase">Build-Up</p>
        <h3 className="spdf-section__title">{title}</h3>
      </div>
      <div className="spdf-section__content">
        {panelOnly ? null : (
          <div className={`spdf-section__kpi${aside ? " spdf-section__kpi--aside" : ""}`}>
            <span className="spdf-section__value">{kpi}</span>
            {aside ? <span className="spdf-section__aside">{aside}</span> : null}
            <span className="spdf-section__unit">{unit}</span>
          </div>
        )}
        <div className="spdf-section__panel">{children}</div>
      </div>
      {footer ? <div className="spdf-section__footer">{footer}</div> : null}
    </section>
  );
}

function PdfSide({
  photoUrl,
  logoUrl,
  clubLogoUrl,
  name,
  club,
}: {
  photoUrl: string;
  logoUrl: string;
  clubLogoUrl: string;
  name: string;
  club: string;
}) {
  return (
    <aside className="spdf-side">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt="" className="spdf-side__logo" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoUrl} alt="" className="spdf-side__photo" />
      <div className="spdf-side__identity">
        <p className="spdf-side__label">Athlete</p>
        <h2 className="spdf-side__name">{name}</h2>
        <p className="spdf-side__club">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={clubLogoUrl} alt="" className="spdf-side__club-logo" />
          {club}
        </p>
      </div>
      <p className="spdf-side__slogan">{BRAND.slogan}</p>
    </aside>
  );
}

function PdfHeader({ title, subtitle, opponentLogoUrl }: { title: string; subtitle: string; opponentLogoUrl: string }) {
  return (
    <header className="spdf-head">
      <div>
        <p className="spdf-head__eyebrow">{BRAND.legal}</p>
        <h1 className="spdf-head__title">{title}</h1>
      </div>
      <div className="spdf-head__meta">
        <span className="spdf-head__match">
          {opponentLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={opponentLogoUrl} alt="" className="spdf-head__logo" />
          ) : null}
          <span>{subtitle}</span>
        </span>
      </div>
    </header>
  );
}

function SummaryMeter({
  segments,
}: {
  segments: { label: string; value: string; share: number; tone: PrintTone }[];
}) {
  const total = segments.reduce((sum, segment) => sum + segment.share, 0);

  return (
    <div className="spdf-summary-meter">
      <div className="spdf-pressure__track">
        {total === 0 ? (
          <span className="spdf-pressure__seg spdf-pressure__seg--grey" style={{ width: "100%" }} />
        ) : (
          segments.map((segment) => (
            <span
              key={segment.label}
              className={`spdf-pressure__seg spdf-pressure__seg--${segment.tone}`}
              style={{ width: `${(segment.share / total) * 100}%` }}
            />
          ))
        )}
      </div>
      <ul className="spdf-pressure__legend">
        {segments.map((segment) => (
          <li key={segment.label}>
            <span className={`spdf-pressure__dot spdf-pressure__dot--${segment.tone}`} />
            <span>{segment.label}</span>
            <strong className={`spdf-tone spdf-tone--${segment.tone}`}>{segment.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryStatCard({
  title,
  total,
  totalLabel,
  rate,
  rateLabel,
  perGameLabel,
  segments,
}: {
  title: string;
  total: number;
  totalLabel: string;
  rate?: number;
  rateLabel?: string;
  perGameLabel?: string;
  segments: { label: string; value: string; share: number; tone: PrintTone }[];
}) {
  return (
    <section className="spdf-section spdf-section--build-up spdf-section--summary">
      <h3 className="spdf-section__title">{title}</h3>
      <div className={`spdf-summary-kpis${rate == null ? " spdf-summary-kpis--single" : ""}`}>
        <div className="spdf-summary-kpi">
          <span className="spdf-summary-kpi__value">{total}</span>
          <span className="spdf-summary-kpi__label">{totalLabel}</span>
          {perGameLabel ? <span className="spdf-summary-kpi__per">{perGameLabel}</span> : null}
        </div>
        {rate != null ? (
          <div className="spdf-summary-kpi spdf-summary-kpi--rate">
            <span className="spdf-summary-kpi__value">{rate}%</span>
            <span className="spdf-summary-kpi__label">{rateLabel}</span>
          </div>
        ) : null}
      </div>
      <SummaryMeter segments={segments} />
    </section>
  );
}

function SummaryPdfPage({
  stats,
  photoUrl,
  logoUrl,
  clubLogoUrl,
  opponentLogoUrl,
}: StatsGamePdfSheetProps) {
  const summary = matchSummary(stats);
  if (!summary) return null;
  const games = stats.meta.games;

  return (
    <article className="stats-pdf" aria-hidden="true">
      <PdfSide
        photoUrl={photoUrl}
        logoUrl={logoUrl}
        clubLogoUrl={clubLogoUrl}
        name={stats.player.name}
        club={stats.player.club}
      />
      <div className="spdf-main">
        <PdfHeader title={stats.meta.title} subtitle={stats.meta.subtitle} opponentLogoUrl={opponentLogoUrl} />
        <div className="spdf-summary">
          <SummaryStatCard
            title="General passing"
            total={summary.totalPasses}
            totalLabel="Total passes"
            rate={summary.accuracy}
            rateLabel="Accurate"
            perGameLabel={games ? `${perGame(summary.totalPasses, games)} per game` : undefined}
            segments={[
              { label: "Accurate", value: String(summary.accurate), share: summary.accurate, tone: "pass-progressive" },
              { label: "Inaccurate", value: String(summary.inaccurate), share: summary.inaccurate, tone: "grey" },
            ]}
          />
          <SummaryStatCard
            title="Offensive duels"
            total={summary.offensiveWon + summary.offensiveLost}
            totalLabel="Total duels"
            rate={summary.offensiveWinRate}
            rateLabel="Won rate"
            perGameLabel={
              games ? `${perGame(summary.offensiveWon + summary.offensiveLost, games)} per game` : undefined
            }
            segments={[
              { label: "Won", value: String(summary.offensiveWon), share: summary.offensiveWon, tone: "pass-progressive" },
              { label: "Lost", value: String(summary.offensiveLost), share: summary.offensiveLost, tone: "grey" },
            ]}
          />
          <SummaryStatCard
            title="Regains"
            total={summary.regains}
            totalLabel="Total regains"
            perGameLabel={games ? `${perGame(summary.regains, games)} per game` : undefined}
            segments={[
              { label: "Interceptions", value: String(summary.interceptions), share: summary.interceptions, tone: "blue" },
              { label: "Recoveries", value: String(summary.recoveries), share: summary.recoveries, tone: "mint" },
            ]}
          />
          <SummaryStatCard
            title="Defensive duels"
            total={summary.defensiveWon + summary.defensiveLost}
            totalLabel="Total duels"
            rate={summary.defensiveWinRate}
            rateLabel="Won rate"
            perGameLabel={
              games ? `${perGame(summary.defensiveWon + summary.defensiveLost, games)} per game` : undefined
            }
            segments={[
              { label: "Won", value: String(summary.defensiveWon), share: summary.defensiveWon, tone: "pass-progressive" },
              { label: "Lost", value: String(summary.defensiveLost), share: summary.defensiveLost, tone: "grey" },
            ]}
          />
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

export function StatsGamePdfSheet({ stats, photoUrl, logoUrl, clubLogoUrl, opponentLogoUrl }: StatsGamePdfSheetProps) {
  const { player, meta, passesUnderPressure, passResults, possessions } = stats;
  const passTotal = passesUnderPressure.total;
  const scope = meta.subtitle === "Season" ? "season" : "match";

  return (
    <>
    <article className="stats-pdf stats-pdf--page1" aria-hidden="true">
      <PdfSide photoUrl={photoUrl} logoUrl={logoUrl} clubLogoUrl={clubLogoUrl} name={player.name} club={player.club} />

      <div className="spdf-main">
        <PdfHeader title={meta.title} subtitle={meta.subtitle} opponentLogoUrl={opponentLogoUrl} />

        <div className="spdf-stack">
          <section className="spdf-section spdf-section--build-up spdf-section--pressure spdf-section--pressure-compact">
            <div className="spdf-section__top">
              <p className="spdf-section__phase">Build-Up</p>
              <h3 className="spdf-section__title">Passes Under Pressure vs Not</h3>
            </div>
            <div className="spdf-pressure">
              <div className="spdf-pressure__total">
                <span className="spdf-pressure__kicker">Total passes</span>
                <span className="spdf-pressure__figure">
                  <span className="spdf-pressure__value">{passTotal}</span>
                </span>
                <span className="spdf-pressure__caption">Passes tracked in the {scope}</span>
              </div>
              <div className="spdf-pressure__context">
                <p className="spdf-pressure__kicker">Pressure context</p>
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

          <PdfSection
            title="Pass Results"
            kpi={passTotal}
            unit="Passes"
            size="lg"
            panelOnly
            className="spdf-section--pass-results"
          >
            <div className="spdf-pass-results-app">
              <PassResultRowBars
                title="Total Passes"
                breakdown={combinePassResults(passResults.underPressure, passResults.notUnderPressure)}
              />
              <div className="spdf-pass-row">
                <PassResultPanel title="Under pressure" breakdown={passResults.underPressure} />
                <PassResultPanel title="Not under pressure" breakdown={passResults.notUnderPressure} />
              </div>
            </div>
          </PdfSection>

          <PdfSection
            title="Possessions"
            kpi={possessions.total}
            unit="Total possessions"
          >
            <div className="spdf-possession-layout">
              <div className="spdf-possession-stat-cards">
                <PdfPossessionStatCard
                  label="Retained"
                  value={Math.max(possessions.total - possessions.lostPlays, 0)}
                  share={pct(Math.max(possessions.total - possessions.lostPlays, 0), possessions.total)}
                  tone="retained"
                />
                <PdfPossessionStatCard
                  label="Lost plays"
                  value={possessions.lostPlays}
                  share={pct(possessions.lostPlays, possessions.total)}
                  tone="lost-plays"
                />
              </div>
              <PdfPossessionSplit
                title="Lost play breakdown"
                primary={possessions.lostBalls}
                secondary={possessions.wrongPasses}
                primaryLabel="Dispossessed"
                secondaryLabel="Inaccurate passes"
                primaryTone="lost-yellow-deep"
                secondaryTone="lost-yellow-light"
              />
            </div>
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
    <SummaryPdfPage
      stats={stats}
      photoUrl={photoUrl}
      logoUrl={logoUrl}
      clubLogoUrl={clubLogoUrl}
      opponentLogoUrl={opponentLogoUrl}
    />
    </>
  );
}
