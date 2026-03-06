"use client";

import { useSidebarStore } from "@/stores/useSidebarStore";
import SidenavButton from "@/components/SidenavButton";
import { usePathname } from "next/navigation";

import SessionInfo from "@/components/SessionInfo";
import WeatherInfo from "@/components/WeatherInfo";
import TrackInfo from "@/components/TrackInfo";
import DelayInput from "@/components/DelayInput";
import DelayTimer from "@/components/DelayTimer";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useLiveData } from "@/contexts/LiveDataContext";
import LayoutSwitcher from "@/components/dashboard/LayoutSwitcher";
import { useLayoutStore } from "@/stores/useLayoutStore";
import { motion, AnimatePresence } from "motion/react";

export default function GlobalHeader() {
    const { pinned, open } = useSidebarStore();
    const { connected } = useLiveData();
    const layoutMode = useLayoutStore((s) => s.layoutMode);
    const pathname = usePathname();
    const isDashboard = pathname.startsWith("/dashboard");
    const isLive = pathname === "/live";

    if (isLive) return null;

    const getTitle = () => {
        if (pathname === "/") return "Home";
        if (pathname === "/live") return "Live Transmission";
        if (pathname === "/schedule") return "Schedule";
        if (pathname === "/help") return "Help";
        if (isDashboard) {
            return layoutMode === "race" ? "Race Mode" : "Focus Mode";
        }
        return pathname.split("/").filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" > ");
    };

    return (
        <header className="flex h-16 w-full items-center justify-between border-b border-white/5 bg-zinc-950/40 px-4 backdrop-blur-md relative z-40 select-none overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-f1-neon/30 to-transparent shadow-[0_1px_10px_rgba(225,6,0,0.1)]" />

            <div className="flex items-center gap-4">
                {!pinned && (
                    <SidenavButton
                        className="glass flex size-10 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                        onClick={() => open()}
                    />
                )}

                <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 h-4">
                            {isDashboard && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-f1-neon/10 border border-f1-neon/20 shadow-[0_0_10px_rgba(225,6,0,0.15)]"
                                >
                                    <span className="relative flex h-1 w-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-f1-neon opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1 w-1 bg-f1-neon"></span>
                                    </span>
                                    <span className="text-[6px] md:text-[7px] font-black text-f1-neon uppercase tracking-wider leading-none">LIVE</span>
                                </motion.div>
                            )}
                            <h1 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/40 leading-none truncate max-w-[100px] md:max-w-none">
                                {getTitle()}
                            </h1>
                        </div>
                        {isDashboard && (
                            <SessionInfo compact className="!p-0 !bg-transparent !border-0 mt-1 scale-90 md:scale-100 origin-left" />
                        )}
                    </div>
                </div>

                {/* Center: Layout Switcher (Centered properly) */}
                <AnimatePresence>
                    {isDashboard && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block"
                        >
                            <div className="glass bg-white/[0.03] backdrop-blur-3xl rounded-xl p-1 border border-white/5 shadow-2xl">
                                <LayoutSwitcher />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 md:gap-6">
                <AnimatePresence>
                    {isDashboard && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="hidden lg:flex items-center gap-4 xl:gap-6 mr-1 pr-4 xl:pr-6 border-r border-white/5"
                        >
                            <WeatherInfo mini />
                            <div className="hidden xl:block">
                                <TrackInfo />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2 md:gap-5 glass bg-white/[0.03] backdrop-blur-3xl rounded-full px-3 md:px-5 py-2 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                    <div className="flex items-center gap-1.5 md:gap-3">
                        <DelayInput saveDelay={500} />
                        <div className="hidden xs:block">
                            <DelayTimer />
                        </div>
                    </div>
                    <ConnectionStatus connected={connected} />
                </div>
            </div>
        </header>
    );
}
