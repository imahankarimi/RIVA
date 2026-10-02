"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useChartColors } from "./chartColors";

type Series = { name: string; values: number[]; color: string };

export function TrendChart({ labels, series, formatValue }: { labels: string[]; series: Series[]; formatValue: (value: number) => string }) {
  const reduceMotion = useReducedMotion();
  const CC = useChartColors();
  const [active, setActive] = useState<number | null>(null);
  const values = series.flatMap((item) => item.values);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const coordinates = (data: number[]) => data.map((value, index) => ({ x: (index / Math.max(data.length - 1, 1)) * 100, y: 90 - ((value - min) / span) * 76 }));
  const path = (data: number[]) => coordinates(data).map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");

  return (
    <div className="relative" onMouseLeave={() => setActive(null)}>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">{series.map((item) => <span key={item.name} className="flex items-center gap-1.5 text-[11.5px] text-ink-faint"><i className="h-2 w-2 rounded-full" style={{ background: item.color }} />{item.name}</span>)}</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-48 w-full overflow-visible" role="img" aria-label={series.map((item) => item.name).join(", ")}>
        {[20, 45, 70, 90].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke={CC.grid} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />)}
        {series.map((item) => <motion.path key={item.name} d={path(item.values)} fill="none" stroke={item.color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.7, ease: "easeOut" }} />)}
        {labels.map((label, index) => <rect key={index} x={(index / labels.length) * 100} y="0" width={100 / labels.length} height="100" fill="transparent" onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} tabIndex={0} aria-label={label} className="cursor-crosshair" />)}
        {active !== null && <><line x1={(active / Math.max(labels.length - 1, 1)) * 100} x2={(active / Math.max(labels.length - 1, 1)) * 100} y1="0" y2="90" stroke={CC.axis} strokeWidth="0.6" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />{series.map((item) => { const point = coordinates(item.values)[active]; return point ? <circle key={item.name} cx={point.x} cy={point.y} r="1.7" fill="rgb(var(--c-surface))" stroke={item.color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" /> : null; })}</>}
      </svg>
      <div className="flex justify-between px-0.5 text-[10.5px] text-ink-faint">{labels.map((label) => <span key={label}>{label}</span>)}</div>
      {active !== null && <div className={cn("pointer-events-none absolute top-8 z-10 min-w-36 rounded-md border border-line bg-surface px-3 py-2 shadow-raised", active > labels.length - 3 ? "end-0" : "start-0")}><p className="text-[11px] text-ink-faint">{labels[active] ?? ""}</p>{series.map((item) => <p key={item.name} className="mt-0.5 flex items-center justify-between gap-3 text-[12px] font-medium text-ink"><span>{item.name}</span><span className="font-mono">{formatValue(item.values[active] ?? 0)}</span></p>)}</div>}
    </div>
  );
}
