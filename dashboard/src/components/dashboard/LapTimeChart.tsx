"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { create } from "zustand";
import { useDataStore } from "@/stores/useDataStore";
import { useFocusStore } from "@/stores/useFocusStore";
import { useLayoutStore } from "@/stores/useLayoutStore";
import clsx from "clsx";

// ─── Types & Store ────────────────────────────────────────────────────────────

type Lap = {
    lap: number;
    time: number;
    pb: boolean;
    ob: boolean;
    est: boolean;
};

const EMPTY: Lap[] = [];

type LapStore = {
    laps: Record<string, Lap[]>;
    seeded: Record<string, boolean>;
    addLap: (nr: string, entry: Lap) => void;
    seed: (nr: string, entries: Lap[]) => void;
};

const useLapStore = create<LapStore>((set) => ({
    laps: {},
    seeded: {},
    addLap: (nr, entry) =>
        set((s) => {
            const cur = s.laps[nr] ?? [];
            if (cur.some((e) => e.lap === entry.lap && !e.est)) return s;
            return { laps: { ...s.laps, [nr]: [...cur, entry] } };
        }),
    seed: (nr, entries) =>
        set((s) => {
            if (s.seeded[nr]) return s;
            return { seeded: { ...s.seeded, [nr]: true }, laps: { ...s.laps, [nr]: entries } };
        }),
}));

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseTime(s?: string | null): number | null {
    if (!s?.trim()) return null;
    const ci = s.indexOf(":");
    if (ci > -1) {
        const m = parseInt(s.slice(0, ci));
        const sec = parseFloat(s.slice(ci + 1));
        return isNaN(m) || isNaN(sec) ? null : m * 60 + sec;
    }
    const v = parseFloat(s);
    return isNaN(v) ? null : v;
}

function fmt(sec: number, short = false): string {
    const m = Math.floor(sec / 60);
    const s = sec - m * 60;
    return short ? `${m}:${s.toFixed(1).padStart(4, "0")}` : `${m}:${s.toFixed(3).padStart(6, "0")}`;
}

function pr(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function buildSyntheticLaps(nr: string, n: number, best: number, last: number): Lap[] {
    const nrI = parseInt(nr) || 1;
    return Array.from({ length: n }, (_, i) => {
        const lap = i + 1;
        if (lap === n) return { lap, time: last, pb: false, ob: false, est: false };
        const fuel = Math.max(0, (1 - lap / n)) * 1.5;
        const v = (pr(nrI * 997 + lap * 13) - 0.5) * 2.5;
        return { lap, time: Math.max(best - 0.3, best + fuel + v), pb: false, ob: false, est: true };
    });
}

// ─── Accumulator ─────────────────────────────────────────────────────────────

function useAccumulator(nr: string | null) {
    const addLap = useLapStore((s) => s.addLap);
    const seed = useLapStore((s) => s.seed);
    const key = useDataStore((s) => {
        if (!nr) return "";
        const d = s.state?.TimingData?.Lines?.[nr];
        return d ? `${d.NumberOfLaps}|${d.LastLapTime?.Value ?? ""}` : "";
    });
    const prev = useRef("");

    useEffect(() => {
        if (!nr || !key || key === prev.current) return;
        const d = useDataStore.getState().state?.TimingData?.Lines?.[nr];
        if (!d) return;

        const n = d.NumberOfLaps;
        const lastSec = parseTime(d.LastLapTime?.Value);
        const bestSec = parseTime(d.BestLapTime?.Value);

        if (!useLapStore.getState().seeded[nr] && n > 0 && lastSec !== null) {
            seed(nr, buildSyntheticLaps(nr, n, bestSec ?? lastSec, lastSec));
            prev.current = key;
            return;
        }

        prev.current = key;
        if (lastSec !== null && n != null) {
            addLap(nr, {
                lap: n, time: lastSec,
                pb: d.LastLapTime?.PersonalFastest ?? false,
                ob: d.LastLapTime?.OverallFastest ?? false,
                est: false,
            });
        }
    }, [key, nr, addLap, seed]);
}

// ─── Smooth bezier helper ─────────────────────────────────────────────────────

function smoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return "";
    const tension = 0.35;
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1] ?? curr;
        const prevPrev = points[i - 2] ?? prev;
        const cp1x = prev.x + (curr.x - prevPrev.x) * tension;
        const cp1y = prev.y + (curr.y - prevPrev.y) * tension;
        const cp2x = curr.x - (next.x - prev.x) * tension;
        const cp2y = curr.y - (next.y - prev.y) * tension;
        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }
    return d;
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function LapChart({ laps, teamColor, driverNr, isFocus }: { laps: Lap[]; teamColor: string; driverNr: string; isFocus: boolean }) {
    const [hovered, setHovered] = useState<number | null>(null);

    const vw = isFocus ? 500 : 380;
    const vh = isFocus ? 220 : 200;
    const pl = 62, pr = 16, pt = 16, pb = 32;
    const cw = vw - pl - pr;
    const ch = vh - pt - pb;

    const { pts, linePath, fillPath, yGuides, xTicks, gradId, minT, maxT } = useMemo(() => {
        const times = laps.map((e) => e.time);
        const minT = Math.min(...times);
        const maxT = Math.max(...times);
        const range = maxT - minT || 0.5;

        const cx = (i: number) => pl + (i / Math.max(laps.length - 1, 1)) * cw;
        const cy = (t: number) => pt + ch - ((t - minT) / range) * ch;

        const rawPts = laps.map((e, i) => ({ x: cx(i), y: cy(e.time), e, i }));

        // Split into synthetic and real segments for different styling
        const linePath = smoothPath(rawPts.map((p) => ({ x: p.x, y: p.y })));
        const last = rawPts.at(-1)!;
        const first = rawPts[0];
        const fillPath = `${linePath} L ${last.x.toFixed(1)} ${(pt + ch).toFixed(1)} L ${first.x.toFixed(1)} ${(pt + ch).toFixed(1)} Z`;

        const yGuides = [0, 1, 2, 3].map((k) => {
            const t = minT + (k / 3) * range;
            return { y: cy(t), label: fmt(t, true) };
        });

        const step = Math.max(1, Math.ceil(laps.length / 8));
        const xTicks = rawPts.filter((p, i) => i % step === 0 || i === rawPts.length - 1);

        const gradId = `grd-${driverNr}`;

        return { pts: rawPts, linePath, fillPath, yGuides, xTicks, gradId, minT, maxT };
    }, [laps, driverNr, cw, ch, pl, pt]);

    const baseY = pt + ch;
    const hoverPt = hovered !== null ? pts[hovered] : null;

    return (
        <svg
            viewBox={`0 0 ${vw} ${vh}`}
            width="100%" height="100%"
            style={{ overflow: "visible" }}
            onMouseLeave={() => setHovered(null)}
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={teamColor} stopOpacity="0.25" />
                    <stop offset="85%" stopColor={teamColor} stopOpacity="0.03" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Y guides */}
            {yGuides.map((g, i) => (
                <g key={i}>
                    <line x1={pl} y1={g.y} x2={pl + cw} y2={g.y}
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth={1}
                        strokeDasharray={i === 0 || i === 3 ? "none" : "5 4"} />
                    <text x={pl - 8} y={g.y + 4} textAnchor="end"
                        fill="rgba(255,255,255,0.5)" fontSize={12}
                        fontFamily="monospace" fontWeight="700">
                        {g.label}
                    </text>
                </g>
            ))}

            {/* X axis */}
            <line x1={pl} y1={baseY} x2={pl + cw} y2={baseY} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            {xTicks.map((p) => (
                <g key={p.i}>
                    <line x1={p.x} y1={baseY} x2={p.x} y2={baseY + 4} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                    <text x={p.x} y={baseY + 16} textAnchor="middle"
                        fill="rgba(255,255,255,0.4)" fontSize={10}
                        fontFamily="monospace">
                        {p.e.lap}
                    </text>
                </g>
            ))}

            {/* Fill */}
            <path d={fillPath} fill={`url(#${gradId})`} />

            {/* Main bezier line */}
            <path d={linePath} fill="none"
                stroke={teamColor} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 5px ${teamColor}90)` }} />

            {/* Hover crosshair */}
            {hoverPt && (
                <>
                    <line x1={hoverPt.x} y1={pt} x2={hoverPt.x} y2={baseY}
                        stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="3 3" />
                    <line x1={pl} y1={hoverPt.y} x2={pl + cw} y2={hoverPt.y}
                        stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="3 3" />
                </>
            )}

            {/* Dots */}
            {pts.map((p) => {
                const isLast = p.i === pts.length - 1;
                const isHov = hovered === p.i;
                const dotColor = p.e.ob ? "#c084fc" : p.e.pb ? "#34d399" : (isLast && !p.e.est) ? teamColor : null;
                const r = isHov ? 5 : (dotColor || isLast) ? 3.5 : p.e.est ? 1.5 : 2.5;

                return (
                    <circle
                        key={p.i}
                        cx={p.x} cy={p.y} r={r}
                        fill={dotColor ?? (p.e.est ? `${teamColor}40` : "rgba(255,255,255,0.35)")}
                        style={dotColor ? { filter: `drop-shadow(0 0 5px ${dotColor})` } : {}}
                        className="cursor-pointer transition-all duration-100"
                        onMouseEnter={() => setHovered(p.i)}
                    />
                );
            })}

            {/* Hover tooltip */}
            {hoverPt && (() => {
                const flip = hoverPt.x > vw * 0.7;
                const tx = flip ? hoverPt.x - 6 : hoverPt.x + 6;
                const anchor = flip ? "end" : "start";
                const boxW = 72, boxH = 34;
                const bx = flip ? hoverPt.x - boxW - 8 : hoverPt.x + 8;
                const by = Math.min(hoverPt.y - boxH / 2, pt + ch - boxH);
                return (
                    <g>
                        <rect x={bx} y={by} width={boxW} height={boxH} rx={5}
                            fill="rgba(9,9,11,0.92)" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                        <text x={bx + 8} y={by + 13} fill="rgba(255,255,255,0.5)" fontSize={8} fontFamily="monospace">
                            L{hoverPt.e.lap}
                        </text>
                        <text x={bx + 8} y={by + 27} fill="rgba(255,255,255,0.5)" fontSize={12}
                            fontFamily="monospace" fontWeight="700">
                            {fmt(hoverPt.e.time)}
                        </text>
                        {hoverPt.e.est && (
                            <text x={bx + boxW - 8} y={by + 13} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={7} fontFamily="monospace">
                                est.
                            </text>
                        )}
                    </g>
                );
            })()}

            {/* Best lap annotation */}
            {(() => {
                const bestPt = pts.reduce((b, p) => (p.e.time < b.e.time ? p : b));
                if (bestPt.e.est) return null;
                return (
                    <g>
                        <circle cx={bestPt.x} cy={bestPt.y} r={5} fill="#34d399"
                            style={{ filter: "drop-shadow(0 0 5px #34d399)" }} />
                        <text x={bestPt.x} y={bestPt.y - 9} textAnchor="middle"
                            fill="#34d399" fontSize={10} fontFamily="monospace" fontWeight="800">
                            BEST
                        </text>
                    </g>
                );
            })()}
        </svg>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LapTimeChart() {
    const layout = useLayoutStore((s) => s.layoutMode);
    const isFocus = layout === "focus";

    const nr = useFocusStore((s) => s.focusedDriver);
    const driver = useDataStore((s) => (nr ? s.state?.DriverList?.[nr] : null));
    const lc = useDataStore((s) => s.state?.LapCount);
    const rawLast = useDataStore((s) =>
        nr ? s.state?.TimingData?.Lines?.[nr]?.LastLapTime?.Value : null
    );

    useAccumulator(nr);

    const lapsRecord = useLapStore((s) => s.laps);
    const laps = (nr ? lapsRecord[nr] : null) ?? EMPTY;

    const tc = `#${driver?.TeamColour ?? "e10600"}`;

    if (!nr || !driver) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-700">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em]">Select a driver from the tower</p>
            </div>
        );
    }

    const realLaps = laps.filter((e) => !e.est);
    const best = laps.length ? laps.reduce((b, e) => (e.time < b.time ? e : b)) : null;
    const last = laps.at(-1) ?? null;
    const secondLast = laps.length > 1 ? laps.at(-2) : null;
    const trend = last && secondLast ? last.time - secondLast.time : null;
    const hasSynth = laps.some((e) => e.est);

    return (
        <div className="flex h-full flex-col gap-2 min-h-0">

            {/* Header */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="h-[3px] w-7 rounded-full"
                    style={{ background: tc, boxShadow: `0 0 10px ${tc}80` }} />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">{driver.Tla}</span>
                <span className="text-[9px] uppercase tracking-wide text-zinc-500">{driver.TeamName}</span>
                {lc && (
                    <span className="ml-auto text-[9px] font-bold tabular-nums text-zinc-600">
                        L{lc.CurrentLap}{lc.TotalLaps ? ` / ${lc.TotalLaps}` : ""}
                    </span>
                )}
            </div>

            {/* Stats */}
            <div className={clsx("grid gap-2 shrink-0", isFocus ? "grid-cols-3" : "grid-cols-2")}>
                {/* Last Lap */}
                <div className={clsx("border border-white/5 bg-white/[0.02] px-3 flex flex-col justify-center rounded-lg", isFocus ? "col-span-1 py-2" : "col-span-2 py-2.5")}>
                    <div className="flex items-center justify-between mb-1">
                        <p className={clsx("font-black uppercase tracking-[0.2em] text-zinc-500", isFocus ? "text-[9px]" : "text-[10px]")}>Last Lap</p>
                        <p className={clsx("font-bold tabular-nums", trend !== null ? (trend < 0 ? "text-emerald-400" : "text-orange-400") : "text-transparent", isFocus ? "text-[10px]" : "text-[12px]")}>
                            {trend !== null ? `${trend < 0 ? "▼" : "▲"} ${Math.abs(trend).toFixed(3)}s` : ""}
                        </p>
                    </div>
                    <p className={clsx("font-black tabular-nums leading-none text-white tracking-tight", isFocus ? "text-[20px]" : "text-[26px]")}>
                        {last ? fmt(last.time) : (rawLast ?? "—")}
                    </p>
                </div>

                {/* Best Lap */}
                <div className={clsx("border border-emerald-500/25 bg-emerald-950/30 px-3 py-2 flex justify-center rounded-lg", isFocus ? "flex-col col-span-1" : "flex-col")}>
                    <p className={clsx("font-black uppercase tracking-[0.2em] text-emerald-500/80 mb-1", isFocus ? "text-[9px]" : "text-[9px]")}>Best Lap</p>
                    <div className={clsx("flex items-baseline", isFocus ? "justify-between" : "gap-2")}>
                        <p className={clsx("font-black tabular-nums leading-none text-emerald-400 tracking-tight", isFocus ? "text-[20px]" : "text-[18px]")}>
                            {best ? fmt(best.time) : "—"}
                        </p>
                        {best && <span className={clsx("font-bold text-emerald-600/70", isFocus ? "text-[9px]" : "text-[9px]")}>L{best.lap}</span>}
                    </div>
                </div>

                {/* Count */}
                <div className={clsx("border border-white/5 bg-white/[0.02] px-3 py-2 flex justify-center rounded-lg", isFocus ? "flex-col col-span-1" : "flex-col")}>
                    <p className={clsx("font-black uppercase tracking-[0.2em] text-zinc-500 mb-1", isFocus ? "text-[9px]" : "text-[9px]")}>Laps</p>
                    <div className={clsx("flex items-baseline", isFocus ? "justify-between" : "gap-2")}>
                        <p className={clsx("font-black tabular-nums leading-none text-white tracking-tight", isFocus ? "text-[20px]" : "text-[18px]")}>{laps.length}</p>
                        <p className="text-[9px] font-bold text-zinc-600">
                            {realLaps.length > 0 ? `${realLaps.length} live` : ""}
                        </p>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0 rounded-lg border border-white/[0.06] bg-black/30 overflow-hidden">
                {laps.length < 2 ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-700 animate-pulse">Loading…</p>
                    </div>
                ) : (
                    <div className="h-full w-full px-1 pt-1">
                        <LapChart laps={laps} teamColor={tc} driverNr={nr} isFocus={isFocus} />
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 shrink-0 pb-0.5">
                {hasSynth && (
                    <div className="flex items-center gap-2">
                        <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
                        <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600">Estimated</span>
                    </div>
                )}
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-purple-400" style={{ boxShadow: "0 0 4px #c084fc" }} />
                    <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600">Overall best</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 4px #34d399" }} />
                    <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600">Personal best</span>
                </div>
                <span className="ml-auto text-[7px] text-zinc-700">Hover dots for details</span>
            </div>
        </div>
    );
}
