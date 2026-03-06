"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import clsx from "clsx";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useDataStore } from "@/stores/useDataStore";
import { useTimingTabStore, type TimingTab } from "@/stores/useTimingTabStore";
import { sortPos } from "@/lib/sorting";
import Driver from "@/components/driver/Driver";

const TABS: { id: TimingTab; label: string }[] = [
	{ id: "timing", label: "Timing" },
	{ id: "sectors", label: "Sectors" },
	{ id: "tires", label: "Tires" },
];

function TabBar() {
	const activeTab = useTimingTabStore((s) => s.activeTab);
	const setTab = useTimingTabStore((s) => s.setTab);

	return (
		<div className="flex items-center gap-1.5 px-3">
			{TABS.map((tab) => {
				const isActive = activeTab === tab.id;
				return (
					<button
						key={tab.id}
						onClick={() => setTab(tab.id)}
						className={clsx(
							"relative px-3 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300",
							isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300",
						)}
					>
						<span className="relative z-10">{tab.label}</span>
						{isActive && (
							<motion.div
								layoutId="timing-tab-underline"
								className="absolute bottom-0 left-0 right-0 h-[2px] bg-f1-neon"
								transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
							/>
						)}
					</button>
				);
			})}
		</div>
	);
}

export default function LeaderBoard() {
	const drivers = useDataStore(({ state }) => state?.DriverList);
	const driversTiming = useDataStore(({ state }) => state?.TimingData);
	const activeTab = useTimingTabStore((s) => s.activeTab);

	return (
		<div className="flex h-full w-full flex-col custom-scrollbar overflow-y-auto overflow-x-hidden">
			<style jsx global>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 4px;
					height: 4px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: rgba(255, 255, 255, 0.1);
					border-radius: 10px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: rgba(255, 255, 255, 0.2);
				}
			`}</style>

			{/* === INTEGRATED HEADER === */}
			<div className="sticky top-0 z-40 flex flex-col bg-zinc-950/98 backdrop-blur-3xl shadow-2xl">
				<div className="pt-1">
					<TabBar />
				</div>

				<div className="grid grid-cols-[55px_40px_1fr] sm:grid-cols-[60px_35px_1fr] md:grid-cols-[85px_30px_1fr] items-center gap-1 md:gap-2 px-2 md:px-3 py-1 border-b border-white/5 mt-0.5">
					<div className="shrink-0">
						<span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-zinc-600">POS</span>
					</div>

					<div className="shrink-0 flex justify-center border-l border-white/10 h-3 items-center">
						<span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-zinc-600 ml-1 md:ml-2">
							<span className="hidden sm:inline">MD</span>
							<span className="sm:hidden">M</span>
						</span>
					</div>

					{activeTab === "timing" && (
						<div className="grid grid-cols-[30px_1fr_55px_75px] sm:grid-cols-[30px_1fr_60px_80px] md:grid-cols-[30px_45px_60px_1fr] items-center gap-1 md:gap-2 border-l border-white/10 h-3 ml-1 pl-1 md:pl-2">
							<div className="flex justify-center">
								<span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-zinc-600">TYRE</span>
							</div>
							<div className="hidden md:flex justify-center border-l border-white/10 h-2">
								<span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">HIST</span>
							</div>
							<div className="flex justify-center border-l border-white/10 h-2">
								<span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-zinc-600">GAP</span>
							</div>
							<div className="flex justify-end pr-1 border-l border-white/10 h-2">
								<span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-zinc-600">LAP</span>
							</div>
						</div>
					)}

					{activeTab === "sectors" && (
						<div className="grid grid-cols-3 items-center gap-1 border-l border-white/10 h-3 ml-1 pl-2">
							<div className="flex justify-center">
								<span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">S1</span>
							</div>
							<div className="flex justify-center border-l border-white/10 h-2">
								<span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">S2</span>
							</div>
							<div className="flex justify-center border-l border-white/10 h-2">
								<span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">S3</span>
							</div>
						</div>
					)}

					{activeTab === "tires" && (
						<div className="flex items-center gap-2 pl-4 border-l border-white/10 h-3 ml-1">
							<div className="h-1.5 w-1.5 rounded-full bg-f1-accent animate-pulse" />
							<span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Strategy Log</span>
							<span className="text-[8px] font-bold text-zinc-600 uppercase ml-2">Live Strategy</span>
						</div>
					)}
				</div>
			</div>

			{(!drivers || !driversTiming) &&
				new Array(20).fill("").map((_, i) => <SkeletonDriver key={`skeleton.${i}`} />)}

			<LayoutGroup key="drivers">
				{drivers && driversTiming && driversTiming.Lines && (
					<AnimatePresence>
						<div className="flex flex-col gap-1.5 pb-20">
							{Object.values(driversTiming.Lines)
								.sort(sortPos)
								.map((timingDriver, index) => (
									<Driver
										key={`lb.driver.${timingDriver.RacingNumber}`}
										position={index + 1}
										driver={drivers[timingDriver.RacingNumber]}
										timingDriver={timingDriver}
									/>
								))}
						</div>
					</AnimatePresence>
				)}
			</LayoutGroup>
		</div>
	);
}

const SkeletonDriver = () => (
	<div className="flex items-center gap-2 rounded-lg p-2">
		<div className="h-7 w-24 animate-pulse rounded-lg bg-zinc-800/60" />
		<div className="h-5 w-10 animate-pulse rounded bg-zinc-800/60" />
		<div className="h-5 w-16 animate-pulse rounded bg-zinc-800/60" />
		<div className="flex-1" />
		<div className="h-5 w-24 animate-pulse rounded bg-zinc-800/60" />
	</div>
);
