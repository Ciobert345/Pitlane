"use client";

import React, { useMemo } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useFocusStore } from "@/stores/useFocusStore";
import clsx from "clsx";

const TYPE_COLORS: Record<string, string> = {
    SOFT: "bg-red-500",
    MEDIUM: "bg-yellow-400",
    HARD: "bg-white",
    INTERMEDIATE: "bg-green-500",
    WET: "bg-blue-500",
    UNKNOWN: "bg-zinc-600",
};

export default function StrategyWidget() {
    const focusedDriver = useFocusStore((state) => state.focusedDriver);

    const timingAppData = useDataStore((state) => state.state?.TimingAppData);
    const timingData = useDataStore((state) => state.state?.TimingData);
    const driverList = useDataStore((state) => state.state?.DriverList);
    const lapCount = useDataStore((state) => state.state?.LapCount);

    const driverInfo = focusedDriver && driverList ? driverList[focusedDriver] : null;
    const driverTiming = focusedDriver && timingData?.Lines ? timingData.Lines[focusedDriver] : null;
    const driverAppData = focusedDriver && timingAppData?.Lines ? timingAppData.Lines[focusedDriver] : null;

    const currentLap = lapCount?.CurrentLap || 0;
    const totalLaps = lapCount?.TotalLaps || 1; // Prevent division by zero

    const stints = useMemo(() => {
        if (!driverAppData?.Stints) return [];
        // The API provides stints. We map them.
        return driverAppData.Stints.map((stint, index) => {
            const compound: string = stint.Compound || "UNKNOWN";
            const lapLength = stint.TotalLaps ?? 0;
            const isNew = stint.New === "true" || stint.New === "True" || stint.New === "TRUE";
            return {
                id: `stint-${index}`,
                compound,
                lapLength,
                isNew,
                colorClass: TYPE_COLORS[compound] || TYPE_COLORS.UNKNOWN,
            };
        });
    }, [driverAppData]);

    const activeStintIndex = stints.length > 0 ? stints.length - 1 : -1;
    const activeStint = activeStintIndex >= 0 ? stints[activeStintIndex] : null;

    if (!focusedDriver || !driverInfo) {
        return (
            <div className="flex h-full min-h-[140px] items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-3 text-zinc-700">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em]">Select a driver from the tower</p>
                </div>
            </div>
        );
    }

    if (stints.length === 0) {
        return (
            <div className="flex h-full min-h-[140px] items-center justify-center">
                <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest animate-pulse">Awaiting Strategy Data...</p>
            </div>
        );
    }

    // Calculate timeline blocks based on total laps
    const timelineBlocks = stints.map(stint => {
        // We ensure minimum 2% width so even very short stints are visible
        const percentage = Math.max((stint.lapLength / totalLaps) * 100, 2);
        return {
            ...stint,
            widthPercentage: percentage,
        };
    });

    // Strategy Prediction Logic
    const expectedLife = (() => {
        const base = (() => {
            switch (activeStint?.compound) {
                case "SOFT": return 18;
                case "MEDIUM": return 28;
                case "HARD": return 40;
                case "INTERMEDIATE": return 22;
                case "WET": return 30;
                default: return 25;
            }
        })();
        return activeStint?.isNew ? base : Math.floor(base * 0.75);
    })();

    const remainingLifeLaps = Math.max(0, expectedLife - (activeStint?.lapLength || 0));
    const predictedPitLap = currentLap + remainingLifeLaps;
    const isGoingToEnd = predictedPitLap >= totalLaps;

    const usedCompounds = new Set(stints.map(s => s.compound));
    const getNextCompound = (current: string) => {
        if (current === "INTERMEDIATE" || current === "WET") return "INTERMEDIATE";
        if (current === "SOFT") return usedCompounds.has("MEDIUM") ? "HARD" : "MEDIUM";
        if (current === "MEDIUM") return usedCompounds.has("HARD") ? "SOFT" : "HARD";
        if (current === "HARD") return usedCompounds.has("MEDIUM") ? "SOFT" : "MEDIUM";
        return "UNKNOWN";
    };
    const nextCompound = getNextCompound(activeStint?.compound || "UNKNOWN");
    const nextCompoundColor = TYPE_COLORS[nextCompound] || TYPE_COLORS.UNKNOWN;

    const isPit = driverTiming?.InPit || false;

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Header: Driver Context */}
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <div className="h-[3px] w-7 rounded-full"
                    style={{ background: `#${driverInfo.TeamColour}`, boxShadow: `0 0 10px #${driverInfo.TeamColour}80` }} />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">{driverInfo.Tla}</span>
                <span className="text-[9px] uppercase tracking-wide text-zinc-500 line-clamp-1">{driverInfo.TeamName}</span>
                {isPit && (
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                        In Pit
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">

                {/* Current Active Tyre Header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 shrink-0">
                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3 shadow-lg backdrop-blur-sm">
                        <div className={clsx("absolute top-0 left-0 w-full h-[2px]", activeStint?.colorClass)} />
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Fitted Compound</p>
                        <div className="flex items-center gap-3">
                            <div className={clsx("h-4 w-4 rounded-full shadow-[0_0_12px_currentColor] border-[3px] border-zinc-900 border-opacity-50", activeStint?.colorClass)} />
                            <span className="text-xl font-black uppercase tracking-widest text-white">{activeStint?.compound || "Unknown"}</span>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3 shadow-lg backdrop-blur-sm">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Stint Laps</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black tabular-nums text-white drop-shadow-md">{activeStint?.lapLength || 0}</span>
                            {activeStint?.isNew ? (
                                <span className="text-[9px] font-black tracking-widest text-emerald-400 capitalize bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">New Set</span>
                            ) : (
                                <span className="text-[9px] font-black tracking-widest text-amber-500 capitalize bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Used Set</span>
                            )}
                        </div>
                    </div>

                    {/* Predicted Pit Stop */}
                    <div className="relative overflow-hidden rounded-xl border border-f1-accent/20 bg-f1-accent/5 p-3 shadow-[0_0_15px_rgba(0,210,255,0.05)] backdrop-blur-sm flex flex-col justify-between sm:col-span-2 md:col-span-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-f1-accent mb-1">Predicted Pit</p>
                        {isGoingToEnd || currentLap >= totalLaps ? (
                            <span className="text-sm font-black uppercase tracking-widest text-white drop-shadow-md mt-auto leading-none pb-0.5">To The End</span>
                        ) : (
                            <div className="flex items-end justify-between mt-auto gap-4">
                                <span className="text-xl font-black tabular-nums text-white drop-shadow-md leading-none">L{predictedPitLap}</span>
                                <div className="flex items-center gap-1.5 opacity-90 mb-0.5">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Next</span>
                                    <div className={clsx("h-2.5 w-2.5 rounded-full shadow-[0_0_5px_currentColor] border-[2px] border-zinc-900", nextCompoundColor)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Strategy Timeline Bar */}
                <div className="shrink-0 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-3">Race Strategy Timeline</p>
                    <div className="h-4 w-full flex rounded-full overflow-hidden bg-black/50 border border-white/10 p-[2px] gap-[2px] shadow-inner">
                        {timelineBlocks.map((block, i) => (
                            <div
                                key={block.id}
                                className={clsx("h-full relative rounded-full", block.colorClass, { "opacity-80": !block.isNew && i !== activeStintIndex, "animate-pulse brightness-110 shadow-[0_0_10px_currentColor]": i === activeStintIndex && !isPit })}
                                style={{ width: `${block.widthPercentage}%` }}
                                title={`${block.compound} - ${block.lapLength} laps`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-1.5 px-1">
                        <span className="text-[9px] font-bold text-zinc-500 tabular-nums uppercase tracking-widest">Lap 0</span>
                        <span className="text-[9px] font-bold text-f1-accent tabular-nums uppercase tracking-widest">Lap {currentLap}</span>
                    </div>
                </div>

                {/* Stint History List */}
                <div className="flex flex-col gap-2 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-2">Stint History</p>
                    {stints.map((stint, i) => (
                        <div key={stint.id} className={clsx("relative flex flex-col md:flex-row md:items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300", i === activeStintIndex ? "bg-white/[0.04] border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.03)]" : "bg-black/20 border-white/5 opacity-70")}>
                            <div className="flex items-center gap-4 w-full md:w-1/2">
                                <span className="text-[12px] font-black text-zinc-500 w-4">{i + 1}</span>
                                <div className={clsx("h-3 w-3 rounded-full ring-2 ring-black", stint.colorClass)} />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                                    {stint.compound}
                                </span>
                            </div>
                            <div className="flex items-center justify-between w-full md:w-1/2 mt-1 md:mt-0">
                                <span className={clsx("text-[10px] font-bold uppercase tracking-widest", stint.isNew ? "text-emerald-400/80" : "text-amber-500/80")}>
                                    {stint.isNew ? "New" : "Used"}
                                </span>
                                <span className="text-[11px] font-black tabular-nums text-zinc-300">
                                    {stint.lapLength} Laps
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
