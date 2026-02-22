"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useDataStore } from "@/stores/useDataStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useFocusStore } from "@/stores/useFocusStore";
import type { CarDataChannels } from "@/types/state.type";

export default function TelemetryPanel() {
    const carsData = useDataStore((state) => state.carsData);
    const drivers = useDataStore((state) => state.state?.DriverList);
    const speedUnit = useSettingsStore((state) => state.speedUnit);
    const focusedDriver = useFocusStore((s) => s.focusedDriver);

    const [history, setHistory] = useState<CarDataChannels[]>([]);
    const lastValRef = useRef<number>(0);

    useEffect(() => {
        setHistory([]);
        lastValRef.current = 0;
    }, [focusedDriver]);

    const driverData = focusedDriver && carsData ? carsData[focusedDriver]?.Channels : undefined;

    useEffect(() => {
        if (carsData) {
            console.log(`[Telemetry] Focused: ${focusedDriver} | Available keys:`, Object.keys(carsData));
            if (focusedDriver && carsData[focusedDriver]) {
                console.log(`[Telemetry] Found driver ${focusedDriver} | Channels:`, !!carsData[focusedDriver].Channels);
            }
        }
    }, [carsData, focusedDriver]);

    useEffect(() => {
        if (!driverData) {
            console.log(`[Telemetry] No driver data for focused driver: ${focusedDriver}`);
            return;
        }
        const v = driverData["2"];
        if (v !== lastValRef.current) {
            setHistory(prev => {
                const next = [...prev, driverData];
                return next.length > 60 ? next.slice(-60) : next;
            });
            lastValRef.current = v;
        }
    }, [driverData, focusedDriver]);

    // Empty state — no driver selected
    if (!focusedDriver || !drivers) {
        return (
            <div className="glass-card flex h-full flex-col items-center justify-center gap-3 !p-6 text-center">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-zinc-700">
                    <circle cx="10" cy="10" r="8" />
                    <path d="M10 6v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600">No Driver Selected</p>
                    <p className="mt-1 text-[10px] text-zinc-700">Click any driver to follow their telemetry</p>
                </div>
                {/* Subtle Debug Info */}
                <div className="mt-4 text-[8px] text-zinc-800 uppercase tracking-widest font-mono">
                    Store: {drivers ? "OK" : "NO_DRIVERS"} | Focus: {focusedDriver ?? "NONE"}
                </div>
            </div>
        );
    }

    if (!drivers[focusedDriver]) {
        return (
            <div className="glass-card flex h-full flex-col items-center justify-center gap-3 !p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500/50">Driver Missing in List</p>
                <p className="text-[8px] text-zinc-700 font-mono">ID: {focusedDriver}</p>
            </div>
        );
    }

    if (!driverData) {
        return (
            <div className="glass-card flex h-full flex-col items-center justify-center gap-3 !p-6 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-400" />
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Waiting for Data</p>
                    <p className="mt-1 text-[10px] text-zinc-700">Telemetria di {drivers[focusedDriver].Tla} non ancora ricevuta</p>
                </div>
            </div>
        );
    }

    const driver = drivers[focusedDriver];
    const teamColor = driver.TeamColour ? `#${driver.TeamColour}` : "#555";

    const rpm = driverData?.["0"] ?? 0;
    const speed = driverData?.["2"] ?? 0;
    const gear = driverData?.["3"] ?? 0;
    const throttle = driverData?.["4"] ?? 0;        // 0–100
    const brake = (driverData?.["5"] ?? 0) * 100; // 0–1 → 0–100
    const aero = driverData?.["45"] ?? 0;
    const isXMode = aero > 9;
    const isOvertake = aero === 8;

    const speedDisplay = speedUnit === "metric" ? speed : Math.floor(speed / 1.609344);
    const speedLabel = speedUnit === "metric" ? "km/h" : "mph";
    const rpmPct = Math.min((rpm / 15000) * 100, 100);

    return (
        <div className="glass-card flex h-full flex-col gap-0 !p-0 overflow-hidden">

            {/* ── Header: driver + DRS ── */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
                <div className="flex items-center gap-2.5">
                    <div className="h-6 w-0.5 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                    <div className="leading-none">
                        <p className="text-sm font-black uppercase tracking-tight text-white">{driver.Tla ?? "---"}</p>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider mt-0.5 truncate max-w-[120px]">{driver.TeamName ?? ""}</p>
                    </div>
                </div>
                <span className={clsx(
                    "rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                    isXMode
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        : isOvertake
                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                            : "border border-white/5 text-zinc-700"
                )}>
                    {isXMode ? "X-MODE" : isOvertake ? "OVERTAKE" : "Z-MODE"}
                </span>
            </div>

            {/* ── Big numbers: Speed + Gear + RPM ── */}
            <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
                <div className="flex flex-col items-center py-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">{speedLabel}</span>
                    <span className="text-3xl font-black tabular-nums text-white leading-none">{speedDisplay}</span>
                </div>
                <div className="flex flex-col items-center py-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Gear</span>
                    <span className="text-3xl font-black tabular-nums leading-none" style={{ color: teamColor }}>
                        {gear > 0 ? gear : "N"}
                    </span>
                </div>
                <div className="flex flex-col items-center py-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">RPM</span>
                    <span className="text-xl font-black tabular-nums text-zinc-300 leading-none">{rpm.toLocaleString()}</span>
                    <div className="mt-1.5 h-1 w-14 overflow-hidden rounded-full bg-zinc-900">
                        <div
                            className="h-full rounded-full transition-all duration-75"
                            style={{ width: `${rpmPct}%`, backgroundColor: rpmPct > 85 ? "#e10600" : teamColor }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Throttle & Brake ── */}
            <div className="flex flex-col gap-2.5 border-b border-white/5 px-4 py-3">
                <Bar label="Throttle" pct={Math.min(throttle, 100)} text={`${Math.round(throttle)}%`} color="#22c55e" glow="rgba(34,197,94,.35)" />
                <Bar label="Brake" pct={Math.min(brake, 100)} text={`${Math.round(brake)}%`} color="#e10600" glow="rgba(225,6,0,.35)" />
            </div>

            {/* ── Speed trace ── */}
            <div className="px-4 py-3">
                <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-700">Speed Trace</p>
                <div className="h-16 w-full overflow-hidden rounded-lg bg-black/30">
                    <SpeedTrace history={history} color={teamColor} />
                </div>
            </div>

        </div>
    );
}

function Bar({ label, pct, text, color, glow }: { label: string; pct: number; text: string; color: string; glow: string }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">{label}</span>
                <span className="text-[10px] font-black tabular-nums" style={{ color }}>{text}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/80">
                <div
                    className="h-full rounded-full transition-all duration-75 ease-out"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        boxShadow: pct > 5 ? `0 0 8px ${glow}` : "none",
                    }}
                />
            </div>
        </div>
    );
}

const SpeedTrace = React.memo(({ history, color }: { history: CarDataChannels[]; color: string }) => {
    if (history.length < 2) return (
        <div className="flex h-full items-center justify-center">
            <p className="text-[9px] text-zinc-800">Collecting data...</p>
        </div>
    );

    const W = 400, H = 64, MAX = 350;
    const pts = history.map((d, i) => {
        const x = (i / (history.length - 1)) * W;
        const y = H - (Math.min(d?.["2"] ?? 0, MAX) / MAX) * H;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pts}
                style={{ filter: `drop-shadow(0 0 3px ${color}88)` }}
            />
        </svg>
    );
});
SpeedTrace.displayName = "SpeedTrace";
