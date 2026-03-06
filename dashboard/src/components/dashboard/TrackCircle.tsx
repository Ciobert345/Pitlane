"use client";

import React, { useMemo } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useFocusStore } from "@/stores/useFocusStore";
import { motion, AnimatePresence } from "motion/react";
import { sortPos } from "@/lib/sorting";

const RADIUS = 168;
const CENTER = 185;
const VIEWBOX = 370;
const TICK_COUNT = 36;

const parseGap = (gap: string | null | undefined): number => {
    if (!gap || gap === "LEADER") return 0;
    const g = String(gap).toUpperCase();
    if (g.includes("LAP")) {
        const laps = parseInt(g);
        return isNaN(laps) ? 30 : laps * 30;
    }
    if (g === "STOP" || g.includes("PIT")) return 0;
    const parsed = parseFloat(gap.replace("+", ""));
    return isNaN(parsed) ? 0 : parsed;
};

export default function TrackCircle() {
    const timingData = useDataStore((state) => state.state?.TimingData);
    const drivers = useDataStore((state) => state.state?.DriverList);
    const focusedDriver = useFocusStore((state) => state.focusedDriver);

    const positionedDrivers = useMemo(() => {
        if (!timingData || !drivers) return [];

        const lines = Object.values(timingData.Lines || {}).sort(sortPos);
        const total = lines.length || 20;

        const prepared = lines.map((line, index) => {
            const driver = drivers[line.RacingNumber];
            const gapStr = line.GapToLeader || line.TimeDiffToFastest || "0";
            const gap = parseGap(gapStr);
            const isPit = (line.InPit || line.Stopped) && !line.Retired && !line.KnockedOut;
            const isOut = !!(line.Retired || line.KnockedOut);
            const isLeader = line.GapToLeader === "LEADER";

            if (isLeader) {
                return {
                    ...line, driver, isPit, isOut, isLeader,
                    x: CENTER, y: CENTER,
                    gapDisplay: gapStr,
                    catching: false,
                    gap: 0,
                };
            }

            // Even angular spread by position → guaranteed no overlaps
            const posAngleDeg = (index / total) * 360;
            const radian = (posAngleDeg - 90) * (Math.PI / 180);

            // Radial position by gap: three clean orbits
            let orbitRadius: number;
            if (isPit) {
                // Widened PIT orbit on mobile to prevent clustering (was 0.38)
                const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
                orbitRadius = RADIUS * (isMobile ? 0.45 : 0.38);
            } else if (gap < 5) {
                orbitRadius = RADIUS * 0.65;
            } else {
                orbitRadius = RADIUS * 0.90;
            }

            return {
                ...line,
                driver,
                isPit,
                isOut,
                isLeader,
                x: CENTER + orbitRadius * Math.cos(radian),
                y: CENTER + orbitRadius * Math.sin(radian),
                gapDisplay: gapStr,
                catching: line.IntervalToPositionAhead?.Catching || false,
                gap,
            };
        });

        return [...prepared].sort((a, b) => {
            if (a.isLeader) return 1;
            if (b.isLeader) return -1;
            if (a.isPit && !b.isPit) return -1;
            return 0;
        });
    }, [timingData, drivers]);

    // Outer bezel tick marks
    const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
        const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
        const isMajor = i % 9 === 0;
        const innerR = RADIUS * 0.96 - (isMajor ? 8 : 4);
        const outerR = RADIUS * 0.96;
        return {
            x1: CENTER + innerR * Math.cos(angle),
            y1: CENTER + innerR * Math.sin(angle),
            x2: CENTER + outerR * Math.cos(angle),
            y2: CENTER + outerR * Math.sin(angle),
            isMajor,
        };
    });

    if (!timingData || !drivers || positionedDrivers.length === 0) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center">
                <div className="relative mb-4 flex h-12 w-12 items-center justify-center">
                    <div className="absolute h-full w-full animate-ping rounded-full border-2 border-f1-accent/20" />
                    <div className="h-2 w-2 rounded-full bg-f1-accent" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 animate-pulse">Scanning…</p>
            </div>
        );
    }

    return (
        <div className="relative flex h-full max-h-full w-full items-center justify-center mx-auto">
            {/* Center glow - use ellipse to fill rectangular containers naturally */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.06)_0%,transparent_75%)]" />

            {/* Force svg overflow visible so strokes and halos never get cropped by viewbox edges */}
            <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="h-full w-full max-h-full max-w-full overflow-visible">

                {/* Bezel ring */}
                <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.97} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                {/* Orbit rings */}
                <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.90} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" strokeDasharray="4 8" />
                <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.65} fill="none" stroke="rgba(52,211,153,0.15)" strokeWidth="0.8" strokeDasharray="3 7" />
                <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.38} fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth="0.8" strokeDasharray="2 6" />

                {/* Orbit labels */}
                <text x={CENTER + RADIUS * 0.90 + 4} y={CENTER + 3} fontSize="6" fill="rgba(255,255,255,0.15)" fontFamily="monospace" fontWeight="700">PACK</text>
                <text x={CENTER + RADIUS * 0.65 + 3} y={CENTER + 3} fontSize="6" fill="rgba(52,211,153,0.35)" fontFamily="monospace" fontWeight="700">&lt;5s</text>
                <text x={CENTER + RADIUS * 0.38 + 2} y={CENTER + 3} fontSize="5.5" fill="rgba(251,191,36,0.35)" fontFamily="monospace" fontWeight="700">PIT</text>

                {/* Bezel tick marks */}
                {ticks.map((t, i) => (
                    <line
                        key={i}
                        x1={t.x1} y1={t.y1}
                        x2={t.x2} y2={t.y2}
                        stroke={t.isMajor ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)"}
                        strokeWidth={t.isMajor ? "1.5" : "0.8"}
                    />
                ))}

                {/* Spokes */}
                {positionedDrivers.filter(d => !d.isLeader && !d.isOut).map((d) => (
                    <line
                        key={`spoke.${d.RacingNumber}`}
                        x1={CENTER} y1={CENTER}
                        x2={d.x} y2={d.y}
                        stroke={`#${d.driver?.TeamColour || "555"}`}
                        strokeWidth="0.5"
                        opacity="0.07"
                    />
                ))}

                {/* Driver Bubbles — use SVG transform for reliable positioning */}
                <AnimatePresence>
                    {positionedDrivers.map((d) => {
                        const teamColor = `#${d.driver?.TeamColour || "888"}`;
                        const isFocused = focusedDriver === d.RacingNumber;
                        const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
                        // Scaled down bubbles on mobile to prevent "jumble" (was 16/20/24)
                        const bubbleR = isMobile
                            ? (isFocused ? 20 : (d.isLeader ? 16 : 13))
                            : (isFocused ? 24 : (d.isLeader ? 20 : 16));
                        const opacityBase = d.isOut ? 0.2 : (d.isPit ? 0.5 : 1);
                        const finalOpacity = focusedDriver && !isFocused ? opacityBase * 0.4 : opacityBase;

                        return (
                            <motion.g
                                key={d.RacingNumber}
                                // Set initial origin to center of TrackCircle so they radiate outwards
                                initial={{ opacity: 0, scale: 0, x: CENTER, y: CENTER }}
                                animate={{
                                    opacity: finalOpacity,
                                    scale: 1,
                                    x: d.x,
                                    y: d.y,
                                }}
                                exit={{ opacity: 0, scale: 0 }}
                                // FIX TELEPORTATION: slow tween for position, fast spring for opacity/scale
                                transition={{
                                    x: { type: "tween", duration: 1.4, ease: "easeInOut" },
                                    y: { type: "tween", duration: 1.4, ease: "easeInOut" },
                                    opacity: { duration: 0.4 },
                                    scale: { type: "spring", stiffness: 200, damping: 22 },
                                }}
                            >
                                {/* Catching glow halo */}
                                {(d.catching || isFocused) && !d.isPit && (
                                    <circle r={bubbleR + 8} fill={isFocused ? "rgba(255,255,255,0.15)" : "rgba(52,211,153,0.10)"} className="animate-pulse" />
                                )}

                                {/* Focused or Leader rings */}
                                {(d.isLeader || isFocused) && (
                                    <>
                                        <circle r={bubbleR + 12} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                        <circle r={bubbleR + 7} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 5" />
                                    </>
                                )}

                                {/* Drop shadow */}
                                <circle r={bubbleR + 3} fill="rgba(0,0,0,0.55)" />

                                {/* Main bubble */}
                                <circle
                                    r={bubbleR}
                                    fill={isFocused ? "#1a1a1a" : "#0c0c0c"}
                                    stroke={d.isPit ? "#f59e0b" : (isFocused || d.isLeader ? "white" : teamColor)}
                                    strokeWidth={isFocused ? 3 : (d.isLeader ? 2.5 : 1.8)}
                                />

                                {/* Team color inner arc (upper portion) */}
                                {!d.isOut && (
                                    <circle
                                        r={bubbleR - 1}
                                        fill="none"
                                        stroke={d.isPit ? "#f59e0b" : teamColor}
                                        strokeWidth="5"
                                        strokeDasharray={`${(bubbleR - 1) * Math.PI * 0.45} ${(bubbleR - 1) * Math.PI * 2}`}
                                        strokeDashoffset={`${(bubbleR - 1) * Math.PI * 0.225}`}
                                        opacity="0.22"
                                        strokeLinecap="round"
                                    />
                                )}

                                {/* Driver abbreviation */}
                                <text
                                    y={d.isLeader ? -3 : -3.5}
                                    textAnchor="middle"
                                    fontSize={d.isLeader ? "12" : "10"}
                                    fontFamily="monospace"
                                    fontWeight="900"
                                    fill={d.isOut ? "#52525b" : "white"}
                                    letterSpacing="-0.5"
                                >
                                    {d.driver?.Tla ?? "---"}
                                </text>

                                {/* Gap / status — large, high contrast */}
                                <text
                                    y={d.isLeader ? 9 : 8}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fontFamily="monospace"
                                    fontWeight="800"
                                    fill={
                                        d.isOut ? "#52525b"
                                            : d.isPit ? "#fbbf24"
                                                : d.catching ? "#34d399"
                                                    : d.isLeader ? "#22d3ee"
                                                        : "#d4d4d8"
                                    }
                                    letterSpacing="0.4"
                                >
                                    {d.isOut
                                        ? "OUT"
                                        : d.isPit
                                            ? "PIT"
                                            : d.isLeader
                                                ? "LEAD"
                                                : d.gapDisplay.replace("+", "")}
                                </text>
                            </motion.g>
                        );
                    })}
                </AnimatePresence>

                {/* Center core */}
                <g transform={`translate(${CENTER}, ${CENTER})`}>
                    <circle r={26} fill="rgba(34,211,238,0.04)" />
                    <circle r={22} fill="#090909" />
                    <circle r={19} fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="1" strokeDasharray="2 4" />
                    <text y="-3" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="900" fill="#22d3ee" letterSpacing="2">F1</text>
                    <text y="7" textAnchor="middle" fontSize="5" fontFamily="monospace" fontWeight="700" fill="rgba(255,255,255,0.2)" letterSpacing="2">LIVE</text>
                </g>
            </svg>

            {/* Live badge */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-f1-accent/20 bg-black/70 px-2.5 py-1 backdrop-blur-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-f1-accent animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-f1-accent/70">Radar</span>
            </div>

            {/* Legend */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <div className="h-1 w-3 rounded-full bg-emerald-400/60" />
                    <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600">Catching</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-1 w-3 rounded-full bg-amber-400/60" />
                    <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600">Pit</span>
                </div>
            </div>
        </div>
    );
}
