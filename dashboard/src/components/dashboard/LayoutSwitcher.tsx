"use client";

import React from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import { useLayoutStore, type LayoutMode } from "@/stores/useLayoutStore";

const RaceIcon = () => (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <rect x="1" y="2" width="14" height="2" rx="1" />
        <rect x="1" y="6" width="14" height="2" rx="1" />
        <rect x="1" y="10" width="14" height="2" rx="1" />
        <rect x="1" y="14" width="14" height="2" rx="1" />
    </svg>
);

const FocusIcon = () => (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
        <rect x="1" y="2" width="14" height="2" rx="1" />
        <rect x="1" y="6" width="9" height="2" rx="1" />
        <rect x="1" y="10" width="14" height="2" rx="1" />
        <rect x="1" y="14" width="9" height="2" rx="1" />
    </svg>
);



type ModeConfig = {
    id: LayoutMode;
    label: string;
    Icon: () => React.ReactElement;
    description: string;
};

const modes: ModeConfig[] = [
    { id: "race", label: "Race", Icon: RaceIcon, description: "Full layout — all widgets visible" },
    { id: "focus", label: "Focus", Icon: FocusIcon, description: "Driver focus — expanded telemetry" },
];

export default function LayoutSwitcher() {
    const layoutMode = useLayoutStore((s) => s.layoutMode);
    const setLayoutMode = useLayoutStore((s) => s.setLayoutMode);

    return (
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1 backdrop-blur-sm">
            {modes.map((mode) => {
                const isActive = layoutMode === mode.id;
                return (
                    <button
                        key={mode.id}
                        onClick={() => setLayoutMode(mode.id)}
                        title={mode.description}
                        className={clsx(
                            "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200",
                            isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300",
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="layout-pill"
                                className="absolute inset-0 rounded-lg bg-white/10"
                                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                            />
                        )}
                        <mode.Icon />
                        <span className="relative z-10 hidden sm:inline tracking-wide">{mode.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
