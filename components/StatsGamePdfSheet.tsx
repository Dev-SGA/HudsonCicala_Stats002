import { BRAND } from "@/lib/brand";
import { clipUrl, combinePassResults, formatCount, matchSummary, perGame, type GameStats, type PassResultBreakdown } from "@/lib/stats";

type StatsGamePdfSheetProps = {
  stats: GameStats;
  photoUrl: string;
  logoUrl: string;
  clubLogoUrl: string;
  opponentLogoUrl: string;
};

type PrintTone = "green" | "yellow" | "blue" | "mint" | "grey" | "pass-progressive" | "pass-lost";

type Tone = "blue" | "red" | "burnt" | "warn" | "pass-progressive" | "pass-neutral" | "pass-lost";

function PdfPlay({ href }: { href?: string }) {
  if (!href) return null;
  return (
    <a className="spdf-play" href={href} data-pdf-link={href} target="_blank" rel="noreferrer" aria-label="Open video">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/play-icon.png" alt="" className="spdf-play__icon" width={14} height={14} />
    </a>
  );
}

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
          <span className={`spdf-stat__value${item.tone ? ` spdf-stat__value--${item.tone}` : ""}`}>{formatCount(item.value)}</span>
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
  videos,
  wide = false,
  compact = false,
}: {
  title: string;
  breakdown: PassResultBreakdown;
  videos?: GameStats["videos"];
  wide?: boolean;
  compact?: boolean;
}) {
  const total = breakdown.progressive + breakdown.neutral + breakdown.lost;
  const turnovers = Math.min(breakdown.turnovers ?? 0, breakdown.lost);
  const bar = [
    { key: "progressive", value: breakdown.progressive, tone: "pass-progressive", host: false },
    { key: "inaccurate", value: breakdown.lost, tone: "pass-inaccurate", host: true },
    { key: "other", value: breakdown.neutral, tone: "pass-neutral", host: false },
  ].filter((segment) => segment.value > 0);
  const legend = [
    {
      key: "progressive",
      label: "Progressive Pass",
      value: breakdown.progressive,
      tone: "pass-progressive",
      nested: false,
      href: clipUrl(videos, "Progressive Passes", "Progressive Pass"),
    },
    {
      key: "inaccurate",
      label: "Inaccurate Pass",
      value: breakdown.lost,
      tone: "pass-inaccurate",
      nested: false,
      href: clipUrl(videos, "Inaccurate Passes", "Inaccurate Pass"),
    },
    {
      key: "turnover",
      label: "Turnover Pass",
      value: turnovers,
      tone: "pass-turnover",
      nested: true,
      href: clipUrl(videos, "Turnover Passes", "Turnover Pass"),
    },
    { key: "other", label: "Other", value: breakdown.neutral, tone: "pass-neutral", nested: false, href: undefined },
  ].filter((segment) => segment.value > 0);

  return (
    <div className={`spdf-pass-panel${wide ? " spdf-pass-panel--wide" : ""}${compact ? " spdf-pass-panel--total" : ""}`}>
      <div className="spdf-pass-panel__head">
        <p className="spdf-pass-panel__title">{title}</p>
        <span className="spdf-pass-panel__total">{formatCount(total)} passes</span>
      </div>
      {compact ? (
        <div className="spdf-pass-panel__meter" style={{ gridTemplateColumns: bar.map((segment) => `${segment.value}fr`).join(" ") }}>
          {bar.map((segment) => (
            <span key={segment.key} className={`spdf-pass-panel__seg spdf-pass-panel__seg--${segment.tone}`} />
          ))}
          {legend
            .filter((segment) => !segment.nested)
            .map((segment) => (
            <div key={`${segment.key}-caption`} className="spdf-pass-panel__cap">
              <span className="spdf-pass-panel__cap-label">
                <span className={`spdf-pass-panel__dot spdf-pass-panel__dot--${segment.tone}`} />
                {segment.label}
              </span>
              <strong>
                {formatCount(segment.value)} · {pct(segment.value, total)}%
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="spdf-pass-panel__track">
            {bar.map((segment) => (
              <span
                key={segment.key}
                className={`spdf-pass-panel__seg spdf-pass-panel__seg--${segment.tone}${segment.host ? " spdf-pass-panel__seg--host" : ""}`}
                style={{ width: `${pct(segment.value, total)}%` }}
              >
                {segment.host && turnovers > 0 ? (
                  <span className="spdf-pass-panel__seg-inner spdf-pass-panel__seg--pass-turnover" style={{ width: `${pct(turnovers, segment.value)}%` }} />
                ) : null}
              </span>
            ))}
          </div>
          <ul className="spdf-pass-panel__legend">
            {legend.map((segment) => (
              <li key={segment.key} className={segment.nested ? "is-nested" : undefined}>
                <span className={`spdf-pass-panel__dot spdf-pass-panel__dot--${segment.tone}`} />
                <span className="spdf-pass-panel__legend-label">
                  {segment.label}
                  <PdfPlay href={segment.href} />
                </span>
                <strong>
                  {formatCount(segment.value)} · {pct(segment.value, total)}%
                </strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

type PdfPossessionSegTone =
  | "retained"
  | "lost-plays"
  | "dispossessed"
  | "wrong-pass"
  | "lost-yellow-deep"
  | "lost-yellow-mid"
  | "lost-yellow-light";

function PdfPossessionStatCard({
  label,
  value,
  share,
  tone,
  perGameLabel,
}: {
  label: string;
  value: number;
  share: number;
  tone: "retained" | "lost-plays" | "turnovers";
  perGameLabel?: string;
}) {
  return (
    <div className={`spdf-possession-stat spdf-possession-stat--${tone}`}>
      <span className="spdf-possession-stat__label">{label}</span>
      <span className="spdf-possession-stat__value">{formatCount(value)}</span>
      <span className="spdf-possession-stat__pct">{share}% of possessions</span>
      {perGameLabel ? <span className="spdf-possession-stat__per">{perGameLabel}</span> : null}
    </div>
  );
}

function PdfPossessionSplit({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number; tone: "lost-yellow-deep" | "lost-yellow-mid"; href?: string }[];
}) {
  const scale = Math.max(
    rows.reduce((sum, row) => sum + row.value, 0),
    1,
  );

  return (
    <div className="spdf-pass-panel spdf-possession-split">
      <p className="spdf-pass-panel__title">{title}</p>
      <ul className="spdf-possession-rows">
        {rows.map((row) => (
          <li key={row.label} className="spdf-possession-row">
            <span className="spdf-possession-row__label">
              {row.label}
              <PdfPlay href={row.href} />
            </span>
            <span className="spdf-possession-row__track">
              <span className={`spdf-possession-row__fill spdf-pass-panel__seg--${row.tone}`} style={{ width: `${pct(row.value, scale)}%` }} />
            </span>
            <strong>{formatCount(row.value)}</strong>
          </li>
        ))}
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
            <span className="spdf-section__value">{formatCount(kpi)}</span>
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

function PdfVideos({ videos }: { videos: { label: string; url: string }[] }) {
  if (videos.length === 0) return null;

  return (
    <section className="spdf-videos">
      <p className="spdf-videos__title">Videos</p>
      <ul className="spdf-videos__list">
        {videos.map((video) => (
          <li key={video.label}>
            <a
              className="spdf-videos__link"
              href={video.url}
              data-pdf-link={video.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="spdf-videos__play" aria-hidden="true">
                <span className="spdf-videos__play-icon" />
              </span>
              <span className="spdf-videos__text">
                <strong>{video.label}</strong>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
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
  segments: { label: string; value: string; share: number; tone: PrintTone; href?: string }[];
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
            <span>
              {segment.label}
              <PdfPlay href={segment.href} />
            </span>
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
  segments: { label: string; value: string; share: number; tone: PrintTone; href?: string }[];
}) {
  return (
    <section className="spdf-section spdf-section--build-up spdf-section--summary">
      <h3 className="spdf-section__title">{title}</h3>
      <div className={`spdf-summary-kpis${rate == null ? " spdf-summary-kpis--single" : ""}`}>
        <div className="spdf-summary-kpi">
          <span className="spdf-summary-kpi__value">{formatCount(total)}</span>
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

function GoalsAssistsCard({ goals, assists, games }: { goals: number; assists: number; games?: number }) {
  const items = [
    { label: "Goals", value: goals },
    { label: "Assists", value: assists },
  ];

  return (
    <section className="spdf-section spdf-section--build-up spdf-section--summary spdf-section--goals">
      <h3 className="spdf-section__title">Goals &amp; Assists</h3>
      <div className="spdf-summary-kpis">
        {items.map((item) => (
          <div key={item.label} className="spdf-summary-kpi">
            <span className="spdf-summary-kpi__value">{formatCount(item.value)}</span>
            <span className="spdf-summary-kpi__label">{item.label}</span>
            {games ? <span className="spdf-summary-kpi__per">{perGame(item.value, games)} per game</span> : null}
          </div>
        ))}
      </div>
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
      <div className="spdf-main spdf-main--stats">
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
              { label: "Accurate", value: formatCount(summary.accurate), share: summary.accurate, tone: "pass-progressive" },
              {
                label: "Inaccurate",
                value: formatCount(summary.inaccurate),
                share: summary.inaccurate,
                tone: "grey",
                href: clipUrl(stats.videos, "Inaccurate Passes", "Inaccurate Pass"),
              },
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
              {
                label: "Won",
                value: formatCount(summary.offensiveWon),
                share: summary.offensiveWon,
                tone: "pass-progressive",
                href: clipUrl(stats.videos, "Off. Duels Won", "Off Duels Won"),
              },
              {
                label: "Lost",
                value: formatCount(summary.offensiveLost),
                share: summary.offensiveLost,
                tone: "grey",
                href: clipUrl(stats.videos, "Off. Duels Lost", "Off Duels Lost"),
              },
            ]}
          />
          <SummaryStatCard
            title="Tackles"
            total={summary.regains}
            totalLabel="Total tackles"
            perGameLabel={games ? `${perGame(summary.regains, games)} per game` : undefined}
            segments={[
              {
                label: "Interceptions",
                value: formatCount(summary.interceptions),
                share: summary.interceptions,
                tone: "blue",
                href: clipUrl(stats.videos, "Interceptions"),
              },
              {
                label: "Recoveries",
                value: formatCount(summary.recoveries),
                share: summary.recoveries,
                tone: "mint",
                href: clipUrl(stats.videos, "Recoveries"),
              },
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
              {
                label: "Won",
                value: formatCount(summary.defensiveWon),
                share: summary.defensiveWon,
                tone: "pass-progressive",
                href: clipUrl(stats.videos, "Def. Duels Won", "Def Duels Won"),
              },
              {
                label: "Lost",
                value: formatCount(summary.defensiveLost),
                share: summary.defensiveLost,
                tone: "grey",
                href: clipUrl(stats.videos, "Def. Duels Lost", "Def Duels Lost"),
              },
            ]}
          />
          <GoalsAssistsCard goals={summary.goals} assists={summary.assists} games={games} />
        </div>
        <PdfVideos videos={stats.videos ?? []} />
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
  const games = meta.games;
  const turnovers = (possessions.passTurnover ?? 0) + (possessions.duelTurnover ?? 0);

  return (
    <>
    <SummaryPdfPage
      stats={stats}
      photoUrl={photoUrl}
      logoUrl={logoUrl}
      clubLogoUrl={clubLogoUrl}
      opponentLogoUrl={opponentLogoUrl}
    />
    <article className="stats-pdf stats-pdf--page1" aria-hidden="true">
      <PdfSide photoUrl={photoUrl} logoUrl={logoUrl} clubLogoUrl={clubLogoUrl} name={player.name} club={player.club} />

      <div className="spdf-main">
        <PdfHeader title={meta.title} subtitle={meta.subtitle} opponentLogoUrl={opponentLogoUrl} />

        <div className="spdf-stack">
          <PdfSection
            title="Pass Results"
            kpi={passTotal}
            unit="Passes"
            size="lg"
            panelOnly
            className="spdf-section--pass-results"
          >
            <div className="spdf-pass-results-app">
              <PassResultPanel
                wide
                title="Total Passes"
                breakdown={combinePassResults(passResults.underPressure, passResults.notUnderPressure)}
                videos={stats.videos}
              />
              <div className="spdf-pass-results-app__pair">
                <PassResultPanel title="Under pressure" breakdown={passResults.underPressure} videos={stats.videos} />
                <PassResultPanel title="Not under pressure" breakdown={passResults.notUnderPressure} videos={stats.videos} />
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
                  perGameLabel={games ? `${perGame(possessions.lostPlays, games)} per game` : undefined}
                />
                <PdfPossessionStatCard
                  label="Turnovers"
                  value={turnovers}
                  share={pct(turnovers, possessions.total)}
                  tone="turnovers"
                  perGameLabel={games ? `${perGame(turnovers, games)} per game` : undefined}
                />
              </div>
              <div className="spdf-possession-breakdowns">
                <PdfPossessionSplit
                  title="Lost play breakdown"
                  rows={[
                    {
                      label: "Lost Duels",
                      value: possessions.lostBalls,
                      tone: "lost-yellow-deep",
                      href: clipUrl(stats.videos, "Off. Duels Lost", "Off Duels Lost"),
                    },
                    {
                      label: "Inaccurate Pass",
                      value: possessions.wrongPasses,
                      tone: "lost-yellow-mid",
                      href: clipUrl(stats.videos, "Inaccurate Passes", "Inaccurate Pass"),
                    },
                  ]}
                />
                <PdfPossessionSplit
                  title="Turnover breakdown"
                  rows={[
                    {
                      label: "Turnover Duel",
                      value: possessions.duelTurnover ?? 0,
                      tone: "lost-yellow-deep",
                      href: clipUrl(stats.videos, "Turnover Duels", "Turnover Duel"),
                    },
                    {
                      label: "Turnover Pass",
                      value: possessions.passTurnover ?? 0,
                      tone: "lost-yellow-mid",
                      href: clipUrl(stats.videos, "Turnover Passes", "Turnover Pass"),
                    },
                  ]}
                />
              </div>
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
    </>
  );
}
