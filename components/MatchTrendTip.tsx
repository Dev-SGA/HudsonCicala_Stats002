"use client";

import { useId, useMemo, type ReactNode } from "react";
import type { MatchStats } from "@/lib/stats";
import {
  formatTrendValue,
  trendFormat,
  trendSeries,
  trendTitle,
  type TrendMetric,
  type TrendPoint,
} from "@/lib/matchTrends";

type MatchTrendTipProps = {
  metric: TrendMetric;
  matches: MatchStats[];
  activeMatchId?: string;
  className?: string;
  children: ReactNode;
};

function MiniLineChart({
  points,
  activeMatchId,
  format,
  title,
}: {
  points: TrendPoint[];
  activeMatchId?: string;
  format: "count" | "percent";
  title: string;
}) {
  const width = 248;
  const height = 88;
  const padX = 12;
  const padY = 14;
  const padBottom = 22;
  const innerW = width - padX * 2;
  const innerH = height - padY - padBottom;

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = points.map((point, index) => {
    const x = padX + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = padY + innerH - ((point.value - min) / span) * innerH;
    return { ...point, x, y };
  });

  const linePath = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} by match`}>
      <line
        x1={padX}
        y1={padY + innerH}
        x2={width - padX}
        y2={padY + innerH}
        className="trend-chart__axis"
      />
      <path d={linePath} className="trend-chart__line" fill="none" />
      {coords.map((point) => {
        const active = activeMatchId && point.id === activeMatchId;
        return (
          <g key={point.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r={active ? 4.5 : 3}
              className={`trend-chart__dot${active ? " trend-chart__dot--active" : ""}`}
            />
            <text x={point.x} y={height - 4} textAnchor="middle" className="trend-chart__label">
              {abbrevLabel(point.label)}
            </text>
            <title>
              {point.label}: {formatTrendValue(point.value, format)}
            </title>
          </g>
        );
      })}
    </svg>
  );
}

function abbrevLabel(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 2)}`;
  }
  return label.slice(0, 3);
}

export function MatchTrendTip({ metric, matches, activeMatchId, className, children }: MatchTrendTipProps) {
  const tipId = useId();
  const points = useMemo(() => trendSeries(matches, metric), [matches, metric]);
  const format = trendFormat(metric);
  const title = trendTitle(metric);

  if (points.length < 2) {
    return <>{children}</>;
  }

  const summary = points.map((point) => `${point.label} ${formatTrendValue(point.value, format)}`).join(", ");

  return (
    <span className={`trend-tip${className ? ` ${className}` : ""}`}>
      <span className="trend-tip__trigger" tabIndex={0} aria-describedby={tipId}>
        {children}
      </span>
      <span id={tipId} className="trend-tip__panel" role="tooltip">
        <span className="trend-tip__title">{title}</span>
        <MiniLineChart points={points} activeMatchId={activeMatchId} format={format} title={title} />
        <span className="trend-tip__sr">{summary}</span>
      </span>
    </span>
  );
}
