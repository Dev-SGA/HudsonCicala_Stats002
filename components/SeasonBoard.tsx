import { Fragment } from "react";
import { passTotals, type MatchStats } from "@/lib/stats";

type SeasonBoardProps = {
  matches: MatchStats[];
};

type Tone = "positive" | "negative" | "accent" | "recover" | "burnt";

type Row = {
  label: string;
  tone?: Tone;
  values: (number | null)[];
};

function sum(values: (number | null)[]): number | null {
  const present = values.filter((value): value is number => value != null);
  return present.length > 0 ? present.reduce((total, value) => total + value, 0) : null;
}

function Cell({ value, tone }: { value: number | null; tone?: Tone }) {
  return <td className={tone ? `season-table__value season-table__value--${tone}` : "season-table__value"}>{value == null ? "—" : value}</td>;
}

function PressureBar({ under, clear }: { under: number; clear: number }) {
  const total = under + clear;
  const underPct = total > 0 ? (under / total) * 100 : 0;

  return (
    <div className="meter season-table__meter" role="img" aria-label={`${under} under pressure. ${clear} not under pressure.`}>
      {total === 0 ? (
        <span className="meter__seg meter__seg--muted" style={{ width: "100%" }} />
      ) : (
        <>
          <span className="meter__seg meter__seg--warn" style={{ width: `${underPct}%` }} />
          <span className="meter__seg meter__seg--accent" style={{ width: `${100 - underPct}%` }} />
        </>
      )}
    </div>
  );
}

export function SeasonBoard({ matches }: SeasonBoardProps) {
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: "Passing",
      rows: [
        { label: "Total passes", values: matches.map((match) => match.passesUnderPressure.total) },
        { label: "Under pressure", values: matches.map((match) => match.passesUnderPressure.underPressure) },
        { label: "Not under pressure", values: matches.map((match) => match.passesUnderPressure.notUnderPressure) },
        { label: "Accurate", tone: "positive", values: matches.map((match) => passTotals(match).accurate) },
        { label: "Inaccurate", tone: "negative", values: matches.map((match) => passTotals(match).inaccurate) },
        { label: "Progressive", values: matches.map((match) => passTotals(match).progressive) },
        { label: "Neutral", values: matches.map((match) => passTotals(match).neutral) },
        { label: "Lost", tone: "negative", values: matches.map((match) => passTotals(match).lost) },
      ],
    },
    {
      title: "Possessions",
      rows: [
        { label: "Total possessions", values: matches.map((match) => match.possessions.total) },
        { label: "Dispossessed", tone: "burnt", values: matches.map((match) => match.possessions.lostBalls) },
        { label: "Wrong passes", values: matches.map((match) => match.possessions.wrongPasses) },
        { label: "Lost plays", tone: "burnt", values: matches.map((match) => match.possessions.lostPlays) },
      ],
    },
    {
      title: "Duels",
      rows: [
        { label: "Offensive won", tone: "positive", values: matches.map((match) => match.duels?.offensiveWon.actions ?? null) },
        { label: "Offensive lost", tone: "negative", values: matches.map((match) => match.duels?.offensiveLost.actions ?? null) },
        { label: "Defensive won", tone: "positive", values: matches.map((match) => match.duels?.defensiveWon.actions ?? null) },
        { label: "Defensive lost", tone: "negative", values: matches.map((match) => match.duels?.defensiveLost.actions ?? null) },
        { label: "Interceptions", tone: "accent", values: matches.map((match) => match.duels?.interception.actions ?? null) },
        { label: "Recoveries", tone: "recover", values: matches.map((match) => match.duels?.recovery.actions ?? null) },
      ],
    },
  ];

  return (
    <section className="season" aria-label="Season">
      <div className="season__legend">
        <span>
          <i className="season__swatch season__swatch--warn" />
          Under pressure
        </span>
        <span>
          <i className="season__swatch season__swatch--accent" />
          Not under pressure
        </span>
      </div>
      <div className="season-scroll">
        <table className="season-table">
          <thead>
            <tr>
              <th scope="col">
                <span className="season-table__metric-label">Metric</span>
              </th>
              {matches.map((match) => (
                <th key={match.id} scope="col">
                  <span className="season-table__club">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={match.logo} alt="" className="club-logo club-logo--pill" />
                    {match.shortLabel}
                  </span>
                  <PressureBar under={match.passesUnderPressure.underPressure} clear={match.passesUnderPressure.notUnderPressure} />
                </th>
              ))}
              <th scope="col">
                <span className="season-table__club">Season</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.title}>
                <tr className="season-table__section">
                  <th scope="colgroup" colSpan={matches.length + 2}>
                    {group.title}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, index) => (
                      <Cell key={matches[index].id} value={value} tone={value == null ? undefined : row.tone} />
                    ))}
                    <Cell value={sum(row.values)} tone={row.tone} />
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
