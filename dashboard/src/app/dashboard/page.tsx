"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import LeaderBoard from "@/components/dashboard/LeaderBoard";
import RaceControl from "@/components/dashboard/RaceControl";
import TeamRadios from "@/components/dashboard/TeamRadios";
import TrackViolations from "@/components/dashboard/TrackViolations";
import Map from "@/components/dashboard/Map";
import TrackCircle from "@/components/dashboard/TrackCircle";
import StrategyWidget from "@/components/dashboard/StrategyWidget";
import LapTimeChart from "@/components/dashboard/LapTimeChart";
import LayoutSwitcher from "@/components/dashboard/LayoutSwitcher";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import LiveTransmission from "@/components/dashboard/LiveTransmission";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useLayoutStore } from "@/stores/useLayoutStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useSocket } from "@/hooks/useSocket";
import { useDataStore } from "@/stores/useDataStore";
import { useEffect } from "react";
import { useDashboardTabStore, type DashboardTab } from "@/stores/useDashboardTabStore";
import clsx from "clsx";

const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
	{ id: "timing", label: "Timing" },
	{ id: "track", label: "Track" },
	{ id: "feeds", label: "Feeds" },
	{ id: "analysis", label: "Analysis" },
];

function DashboardTabs() {
	const activeTab = useDashboardTabStore((s) => s.activeTab);
	const setTab = useDashboardTabStore((s) => s.setTab);

	return (
		<div className="flex lg:hidden items-center gap-1 p-1 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-xl mb-2 sticky top-0 z-[100]">
			{DASHBOARD_TABS.map((tab) => {
				const isActive = activeTab === tab.id;
				return (
					<button
						key={tab.id}
						onClick={() => setTab(tab.id)}
						className={clsx(
							"flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
							isActive
								? "bg-f1-neon text-white shadow-[0_0_15px_rgba(225,6,0,0.4)]"
								: "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
						)}
					>
						{tab.label}
					</button>
				);
			})}
		</div>
	);
}

const fadeItem: Variants = {
	hidden: { opacity: 0, scale: 0.99 },
	show: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
	exit: { opacity: 0, scale: 0.99, transition: { duration: 0.15 } },
};

/** Thin section divider label */
function Label({ children }: { children: React.ReactNode }) {
	return (
		<p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 select-none">
			{children}
		</p>
	);
}

/** A panel that fills available space and scrolls internally */
function Panel({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
	return (
		<div className={`flex min-h-0 flex-col ${className}`}>
			<Label>{label}</Label>
			<div className="flex-1 overflow-y-auto overflow-x-hidden">
				{children}
			</div>
		</div>
	);
}

function SocketStatus() {
	const { connected } = useSocket({ handleInitial: () => { }, handleUpdate: () => { } });

	return (
		<div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1">
			<ConnectionStatus connected={connected} />
			<span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
				{connected ? "Live" : "Connecting..."}
			</span>
		</div>
	);
}

export default function Page() {
	const layoutMode = useLayoutStore((s) => s.layoutMode);
	const activeTab = useDashboardTabStore((s) => s.activeTab);
	const [activeFeedTab, setActiveFeedTab] = useState<"control" | "investigations">("control");

	const messages = useDataStore((state) => state.state?.RaceControlMessages?.Messages);
	const [lastSeenInvestigations, setLastSeenInvestigations] = useState(0);

	const investigationsCount = messages?.filter((m) =>
		m.Category === "Other" && m.Message.includes("TRACK LIMITS")
	).length || 0;

	useEffect(() => {
		if (activeFeedTab === "investigations") {
			setLastSeenInvestigations(investigationsCount);
		}
	}, [activeFeedTab, investigationsCount]);

	const hasNewInvestigations = investigationsCount > lastSeenInvestigations && activeFeedTab !== "investigations";

	return (
		// Fill the parent container height exactly — no page-level scroll on desktop, but allow scroll on mobile
		// Fill the parent container height exactly — no page-level scroll on desktop, but allow scroll on mobile
		<div className="flex flex-col h-full min-h-0 gap-2 p-2 overflow-y-auto lg:overflow-hidden">
			<DashboardTabs />

			{/* Mode Content */}
			<AnimatePresence mode="wait">
				{layoutMode === "race" ? (
					<motion.div
						key="race"
						variants={fadeItem} initial="hidden" animate="show" exit="exit"
						className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr_300px] lg:min-h-0 lg:flex-1 gap-4"
					>
						{/* LEFT: Timing Tower */}
						<div className={clsx(
							"flex flex-col rounded-2xl border border-white/5 bg-zinc-950/20 px-4 py-3 lg:min-h-0",
							activeTab !== "timing" && "hidden lg:flex"
						)}>
							<Label>Timing Tower</Label>
							<div className="flex-1 lg:min-h-0 min-h-[500px]">
								<LeaderBoard />
							</div>
						</div>

						{/* CENTER: Live Track & Feeds */}
						<div className={clsx(
							"flex min-h-0 flex-1 flex-col gap-4",
							activeTab !== "track" && activeTab !== "feeds" && "hidden lg:flex"
						)}>
							<div className={clsx(
								"flex-[4] flex min-h-[400px] lg:min-h-0 flex-col rounded-xl border border-white/5 bg-black/50 backdrop-blur-xl overflow-hidden",
								activeTab !== "track" && "hidden lg:flex"
							)}>
								<div className="px-3 pt-3 pb-1 shrink-0">
									<Label>Live Track</Label>
								</div>
								<div className="flex-1 min-h-[300px] lg:min-h-0 w-full">
									<Map />
								</div>
							</div>

							{/* Unified Feeds Row */}
							<div className={clsx(
								"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.1fr_1fr] min-h-0 lg:h-60 shrink-0 gap-3 mt-auto",
								activeTab !== "feeds" && "hidden lg:grid"
							)}>
								<div className="flex min-h-0 flex-col rounded-xl border border-white/5 bg-black/20 backdrop-blur-md px-3 py-2">
									{/* Premium Tab Switcher */}
									<div className="flex items-center gap-1 mb-3 bg-white/5 p-1 rounded-lg mx-auto">
										<button
											onClick={() => setActiveFeedTab("control")}
											className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeFeedTab === "control" ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-zinc-500 hover:text-zinc-300"}`}
										>
											Race Control
										</button>
										<button
											onClick={() => setActiveFeedTab("investigations")}
											className={`relative px-4 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeFeedTab === "investigations" ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-zinc-500 hover:text-zinc-300"}`}
										>
											Investigations
											{hasNewInvestigations && (
												<span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
													<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-f1-accent opacity-75"></span>
													<span className="relative inline-flex rounded-full h-2 w-2 bg-f1-accent"></span>
												</span>
											)}
										</button>
									</div>

									<div className="flex-1 min-h-[300px] lg:min-h-0 overflow-y-auto custom-scrollbar">
										{activeFeedTab === "control" ? (
											<RaceControl />
										) : (
											<TrackViolations />
										)}
									</div>
								</div>
								<Panel label="Team Radio" className="rounded-xl border border-white/5 bg-black/20 backdrop-blur-md px-3 py-2 min-h-[300px] lg:min-h-0">
									<TeamRadios />
								</Panel>
								<div className="flex min-h-[160px] md:min-h-0 flex-col rounded-xl border border-white/5 bg-black/20 backdrop-blur-md overflow-hidden relative">
									<WeatherWidget />
								</div>
							</div>
						</div>

						{/* RIGHT: Analysis Sidebar */}
						<div className={clsx(
							"flex flex-col gap-4 lg:min-h-0",
							activeTab !== "analysis" && "hidden lg:flex"
						)}>
							<div className="flex-[1.5] flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4 lg:min-h-0 min-h-[300px]">
								<Label>Track Radar</Label>
								<div className="flex-1 lg:min-h-0 relative"><TrackCircle /></div>
							</div>
							<div className="flex-[2.5] flex flex-col rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-4 shadow-2xl backdrop-blur-sm lg:min-h-0 min-h-[400px]">
								<Label>Lap Times</Label>
								<div className="flex-1 lg:min-h-0"><LapTimeChart /></div>
							</div>
						</div>
					</motion.div>
				) : layoutMode === "focus" && (
					<motion.div
						key="focus"
						variants={fadeItem} initial="hidden" animate="show" exit="exit"
						className="grid grid-cols-1 lg:grid-cols-[minmax(0,500px)_1fr] min-h-0 flex-1 gap-4"
					>
						{/* Timing Tower */}
						<div className="flex min-h-0 flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-4">
							<Label>Timing Tower</Label>
							<div className="flex-1 overflow-x-auto overflow-y-auto">
								<LeaderBoard />
							</div>
						</div>

						{/* Right: Radar + Map + Strategy + Lap Times */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-rows-2 lg:min-h-0 gap-4">
							<div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4 lg:min-h-0 min-h-[300px]">
								<Label>Track Radar</Label>
								<div className="flex-1 lg:min-h-0 relative"><TrackCircle /></div>
							</div>
							<div className="flex min-h-0 flex-col rounded-xl border border-white/5 bg-black/50 backdrop-blur-xl overflow-hidden p-3">
								<Label>Track Map</Label>
								<div className="flex-1 min-h-0 relative"><Map /></div>
							</div>
							<div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4 lg:min-h-0 min-h-[400px]">
								<Label>Strategy Center</Label>
								<div className="flex-1 lg:min-h-0 relative"><StrategyWidget /></div>
							</div>
							<div className="flex flex-col rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-4 shadow-2xl backdrop-blur-sm lg:min-h-0 min-h-[300px]">
								<Label>Lap Times</Label>
								<div className="flex-1 lg:min-h-0"><LapTimeChart /></div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
