import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { combinePassResults, matchSummary, perGame, type GameStats, type PassResultBreakdown } from "@/lib/stats";

type StatsGamePdfSheetProps = {
  stats: GameStats;
  photoUrl: string;
  logoUrl: string;
  clubLogoUrl: string;
  opponentLogoUrl: string;
};

type PrintTone = "green" | "yellow" | "blue" | "mint" | "grey";

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
    { value: breakdown.progressive, tone: "pass-progressive" as const },
    { value: breakdown.neutral, tone: "pass-neutral" as const },
    { value: breakdown.lost, tone: "pass-lost" as const },
  ];

  return (
    <div className={`spdf-pass-panel${compact ? " spdf-pass-panel--total" : ""}`}>
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
  aside,
  children,
  footer,
  size = "md",
}: {
  title: string;
  kpi: number;
  unit: string;
  aside?: string;
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
        <div className={`spdf-section__kpi${aside ? " spdf-section__kpi--aside" : ""}`}>
          <span className="spdf-section__value">{kpi}</span>
          {aside ? <span className="spdf-section__aside">{aside}</span> : null}
          <span className="spdf-section__unit">{unit}</span>
        </div>
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
      <div className="spdf-side__photo" data-pdf-bg={photoUrl} style={{ backgroundImage: `url(${photoUrl})` }} />
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

function SummaryCard({
  title,
  kpi,
  unit,
  aside,
  detail,
  children,
}: {
  title: string;
  kpi: string;
  unit: string;
  aside?: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <section className="spdf-section spdf-section--build-up spdf-section--summary">
      <div className="spdf-section__top">
        <p className="spdf-section__phase">Summary</p>
        <h3 className="spdf-section__title">{title}</h3>
      </div>
      <div className="spdf-section__content">
        <div className={`spdf-section__kpi${aside || detail ? " spdf-section__kpi--aside" : ""}`}>
          <span className="spdf-section__value">{kpi}</span>
          {aside ? <span className="spdf-section__aside">{aside}</span> : null}
          <span className="spdf-section__unit">{unit}</span>
          {detail ? <span className="spdf-section__detail">{detail}</span> : null}
        </div>
        <div className="spdf-section__panel">{children}</div>
      </div>
    </section>
  );
}

function SummaryMeter({
  headline,
  segments,
}: {
  headline: string;
  segments: { label: string; value: string; share: number; tone: PrintTone }[];
}) {
  const total = segments.reduce((sum, segment) => sum + segment.share, 0);

  return (
    <div className="spdf-pressure__context">
      <p className="spdf-pressure__headline">{headline}</p>
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
        <PdfHeader title="Stats" subtitle={stats.meta.subtitle} opponentLogoUrl={opponentLogoUrl} />
        <div className="spdf-summary">
          <SummaryCard
            title="General passing"
            kpi={String(summary.totalPasses)}
            unit="Total passes"
            aside={games ? `${perGame(summary.totalPasses, games)} per game` : undefined}
            detail={`${summary.accuracy}% accurate`}
          >
            <SummaryMeter
              headline={`${summary.accurate} accurate · ${summary.inaccurate} inaccurate`}
              segments={[
                { label: "Accurate", value: String(summary.accurate), share: summary.accurate, tone: "green" },
                { label: "Inaccurate", value: String(summary.inaccurate), share: summary.inaccurate, tone: "yellow" },
              ]}
            />
          </SummaryCard>
          <SummaryCard
            title="Interceptions & recoveries"
            kpi={String(summary.regains)}
            unit="Total"
            aside={games ? `${perGame(summary.regains, games)} per game` : undefined}
          >
            <SummaryMeter
              headline={`${summary.interceptions} interceptions · ${summary.recoveries} recoveries`}
              segments={[
                { label: "Interceptions", value: String(summary.interceptions), share: summary.interceptions, tone: "blue" },
                { label: "Recoveries", value: String(summary.recoveries), share: summary.recoveries, tone: "mint" },
              ]}
            />
          </SummaryCard>
          <SummaryCard title="Offensive duels" kpi={`${summary.offensiveWinRate}%`} unit="Won">
            <SummaryMeter
              headline={`${summary.offensiveWon} won · ${summary.offensiveLost} lost`}
              segments={[
                { label: "Won", value: String(summary.offensiveWon), share: summary.offensiveWon, tone: "green" },
                { label: "Lost", value: String(summary.offensiveLost), share: summary.offensiveLost, tone: "yellow" },
              ]}
            />
          </SummaryCard>
          <SummaryCard title="Defensive duels" kpi={`${summary.defensiveWinRate}%`} unit="Won">
            <SummaryMeter
              headline={`${summary.defensiveWon} won · ${summary.defensiveLost} lost`}
              segments={[
                { label: "Won", value: String(summary.defensiveWon), share: summary.defensiveWon, tone: "green" },
                { label: "Lost", value: String(summary.defensiveLost), share: summary.defensiveLost, tone: "yellow" },
              ]}
            />
          </SummaryCard>
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
  const games = meta.games;

  return (
    <>
    <article className="stats-pdf" aria-hidden="true">
      <PdfSide photoUrl={photoUrl} logoUrl={logoUrl} clubLogoUrl={clubLogoUrl} name={player.name} club={player.club} />

      <div className="spdf-main">
        <PdfHeader title={meta.title} subtitle={meta.subtitle} opponentLogoUrl={opponentLogoUrl} />

        <div className="spdf-stack">
          <section className="spdf-section spdf-section--build-up spdf-section--pressure">
            <div className="spdf-section__top">
              <p className="spdf-section__phase">Build-Up</p>
              <h3 className="spdf-section__title">Passes Under Pressure vs Not</h3>
            </div>
            <div className="spdf-pressure">
              <div className="spdf-pressure__total">
                <span className="spdf-pressure__kicker">Total passes</span>
                <span className="spdf-pressure__figure">
                  <span className="spdf-pressure__value">{passTotal}</span>
                  {games ? <span className="spdf-pressure__per">{perGame(passTotal, games)} per game</span> : null}
                </span>
                <span className="spdf-pressure__caption">Passes tracked in the {scope}</span>
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

          <PdfSection
            title="Pass Results"
            kpi={passTotal}
            unit="Passes"
            size="lg"
            aside={games ? `${perGame(passTotal, games)} per game` : undefined}
          >
            <div className="spdf-pass-stack">
              <PassResultPanel
                title="Total passes"
                breakdown={combinePassResults(passResults.underPressure, passResults.notUnderPressure)}
                compact
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
            aside={games ? `${perGame(possessions.total, games)} per game` : undefined}
          >
            <StatTiles
              items={[
                {
                  label: "Dispossessed",
                  value: possessions.lostBalls,
                  tone: "burnt",
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
