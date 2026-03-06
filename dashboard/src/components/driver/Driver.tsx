"use client";

import React from "react";
import clsx from "clsx";
import { motion } from "motion/react";
import Image from "next/image";

import type { Driver, TimingDataDriver } from "@/types/state.type";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useDataStore } from "@/stores/useDataStore";
import { useFocusStore } from "@/stores/useFocusStore";
import { useTimingTabStore } from "@/stores/useTimingTabStore";

import DriverTag from "./DriverTag";
import DriverAeroMode from "./DriverAeroMode";
import DriverGap from "./DriverGap";
import DriverTire from "./DriverTire";
import DriverMiniSectors from "./DriverMiniSectors";
import DriverLapTime from "./DriverLapTime";
import DriverInfo from "./DriverInfo";
import DriverCarMetrics from "./DriverCarMetrics";

type Props = {
	position: number;
	driver: Driver;
	timingDriver: TimingDataDriver;
};

const isXModeActive = (aero: number) => aero > 9;
const isOvertakePossible = (aero: number) => aero === 8;

const inDangerZone = (position: number, sessionPart: number) => {
	switch (sessionPart) {
		case 1: return position > 15;
		case 2: return position > 10;
		default: return false;
	}
};

export default function Driver({ driver, timingDriver, position }: Props) {
	const sessionPart = useDataStore((state) => state.state?.TimingData?.SessionPart);
	const timingStatsDriver = useDataStore((state) => state.state?.TimingStats?.Lines[driver.RacingNumber]);
	const appTimingDriver = useDataStore((state) => state.state?.TimingAppData?.Lines[driver.RacingNumber]);
	const carData = useDataStore((state) => state.carsData ? state.carsData[driver.RacingNumber]?.Channels : undefined);

	const hasFastest = timingStatsDriver?.PersonalBestLapTime.Position === 1;
	const favoriteDriver = useSettingsStore((state) => state.favoriteDrivers.includes(driver.RacingNumber));

	const focusedDriver = useFocusStore((s) => s.focusedDriver);
	const setFocusedDriver = useFocusStore((s) => s.setFocusedDriver);
	const clearFocusedDriver = useFocusStore((s) => s.clearFocusedDriver);
	const isFocused = focusedDriver === driver.RacingNumber;

	const activeTab = useTimingTabStore((s) => s.activeTab);

	const handleClick = () => {
		isFocused ? clearFocusedDriver() : setFocusedDriver(driver.RacingNumber);
	};

	return (
		<motion.div
			layout="position"
			onClick={handleClick}
			className={clsx(
				"group relative grid grid-cols-[55px_40px_1fr] sm:grid-cols-[60px_35px_1fr] md:grid-cols-[85px_30px_1fr] cursor-pointer select-none items-center gap-1 sm:gap-2 rounded-xl p-1.5 transition-all duration-200 border border-transparent overflow-hidden",
				{
					"opacity-40 grayscale": timingDriver.KnockedOut || timingDriver.Retired || timingDriver.Stopped,
					"bg-white/[0.04] border-white/5": !isFocused && !favoriteDriver && !hasFastest,
					"bg-f1-accent/10 border-f1-accent/30": favoriteDriver && !isFocused,
					"bg-f1-purple/10 border-f1-purple/30": hasFastest && !favoriteDriver && !isFocused,
					"bg-f1-neon/10 border-f1-neon/30":
						sessionPart != null && inDangerZone(position, sessionPart) && !favoriteDriver && !isFocused,
					"hover:bg-white/[0.08]": !isFocused,
				},
			)}
			style={isFocused ? {
				borderColor: `#${driver.TeamColour}88`,
				backgroundColor: `#${driver.TeamColour}18`,
				boxShadow: `0 0 25px #${driver.TeamColour}12`,
			} : undefined}
		>
			{/* Focused left bar */}
			{isFocused && (
				<motion.div
					layoutId="focus-indicator"
					className="absolute inset-y-1.5 left-0 w-1.5 rounded-r-full z-10"
					style={{ backgroundColor: `#${driver.TeamColour}` }}
					transition={{ type: "spring", bounce: 0.2 }}
				/>
			)}

			{/* Column 1: Position Tag - Precise allocation */}
			<div className="shrink-0 w-[55px] sm:w-[60px] md:w-[85px]">
				<DriverTag
					short={driver.Tla}
					teamColor={driver.TeamColour}
					position={position}
					className="w-full h-8 md:h-10 shadow-xl shadow-black/20"
				/>
			</div>

			{/* Column 2: Aero/Override - Dynamic fixed width */}
			<div className="flex justify-center shrink-0 w-[40px] sm:w-[35px] md:w-[30px] border-x border-white/5 h-full items-center">
				<DriverAeroMode
					on={carData ? isXModeActive(carData[45]) : false}
					possible={carData ? isOvertakePossible(carData[45]) : false}
					inPit={timingDriver.InPit}
					pitOut={timingDriver.PitOut}
				/>
			</div>

			{/* Column 3: Tab Content (Sub-grid for Timing) */}
			{activeTab === "timing" && (
				<div className="grid grid-cols-[30px_1fr_55px_75px] sm:grid-cols-[30px_1fr_60px_80px] md:grid-cols-[30px_45px_60px_1fr] items-center gap-1 md:gap-2 w-full h-full">
					{/* Tire Icon */}
					<div className="flex justify-center shrink-0">
						<DriverTire stints={appTimingDriver?.Stints} mode="icon" />
					</div>

					{/* Tire Stats (Hidden on mobile) */}
					<div className="hidden md:flex shrink-0 border-r border-white/5 pr-2 h-full items-center">
						<DriverTire stints={appTimingDriver?.Stints} mode="stats" />
					</div>

					{/* Gap / Interval */}
					<div className="shrink-0 text-center lg:text-left">
						<DriverGap timingDriver={timingDriver} sessionPart={sessionPart} />
					</div>

					{/* Last Lap Time */}
					<div className="text-right flex-1 min-w-0 font-mono pr-1">
						<DriverLapTime
							last={timingDriver.LastLapTime}
							best={timingDriver.BestLapTime}
							hasFastest={hasFastest}
						/>
					</div>
				</div>
			)}

			{activeTab === "sectors" && (
				<div className="flex-1 min-w-0 border-l border-white/10 h-full ml-1 pl-2">
					<DriverMiniSectors
						sectors={timingDriver.Sectors}
						bestSectors={timingStatsDriver?.BestSectors}
					/>
				</div>
			)}

			{activeTab === "tires" && (
				<div className="flex flex-1 flex-col justify-center gap-1.5 min-w-0 border-l border-white/10 h-full ml-1 pl-4 py-1.5">
					{/* LINE 1: LIVE TELEMETRY */}
					{appTimingDriver?.Stints && (
						<div className="flex items-center gap-4">
							{(() => {
								const currentStint = appTimingDriver.Stints[appTimingDriver.Stints.length - 1];
								const c = currentStint?.Compound?.toLowerCase() ?? "unknown";
								const unknownCompound = !["soft", "medium", "hard", "intermediate", "wet"].includes(c);
								const laps = currentStint?.TotalLaps ?? 0;
								const pitstops = appTimingDriver.Stints.length - 1;

								return (
									<>
										<div className="flex items-center gap-3">
											<div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 shadow-2xl">
												<Image
													src={"/tires/" + (unknownCompound ? "unknown" : c) + ".svg"}
													width={26}
													height={26}
													alt={c}
													className="drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]"
												/>
											</div>
											<div className="flex flex-col">
												<div className="flex items-baseline gap-1.5">
													<span className="text-[14px] font-black tabular-nums text-white leading-none tracking-tight">
														{laps}
													</span>
													<span className="text-[8px] font-bold text-zinc-600 uppercase">Laps</span>
												</div>
												<span className="text-[9px] font-black uppercase tracking-widest text-[#ef4444]" style={{ color: unknownCompound ? "#888" : undefined }}>
													{c}
												</span>
											</div>
										</div>

										<div className="h-4 w-px bg-white/10" />

										<div className="flex items-center gap-3">
											<div className="flex flex-col">
												<span className="text-[7px] font-black text-zinc-600 uppercase leading-none">Strategy</span>
												<div className="flex items-baseline gap-1 mt-0.5">
													<span className="text-[11px] font-black text-zinc-300 tabular-nums leading-none">{pitstops}</span>
													<span className="text-[7px] font-bold text-zinc-600 uppercase">Stops</span>
												</div>
											</div>
											<div className="flex h-5 items-center rounded-full bg-zinc-900/80 border border-white/5 px-2">
												<span className="text-[7px] font-black text-f1-accent uppercase tracking-tighter">Live Monitor</span>
											</div>
										</div>
									</>
								);
							})()}
						</div>
					)}

					{/* LINE 2: STRATEGY TIMELINE (STINT TAPE) */}
					{appTimingDriver?.Stints && (
						<div className="flex items-center gap-1.5">
							<div className="flex items-center gap-1 opacity-60">
								<span className="text-[7px] font-black text-zinc-700 uppercase">Timeline</span>
								<div className="h-px w-2 bg-zinc-800" />
							</div>

							<div className="flex flex-wrap items-center gap-1">
								{appTimingDriver.Stints.map((stint, i) => {
									const isCurrent = i === appTimingDriver.Stints.length - 1;
									const c = stint.Compound?.toLowerCase() ?? "unknown";
									const unknownCompound = !["soft", "medium", "hard", "intermediate", "wet"].includes(c);

									if (isCurrent) return null; // Already shown in Line 1

									return (
										<React.Fragment key={i}>
											<div
												className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-md px-1.5 py-0.5 hover:bg-black/60 transition-colors"
												title={`${c} – ${stint.TotalLaps}L`}
											>
												<Image
													src={"/tires/" + (unknownCompound ? "unknown" : c) + ".svg"}
													width={10}
													height={10}
													alt={c}
													className="opacity-70"
												/>
												<span className="text-[8px] font-bold tabular-nums text-zinc-500">{stint.TotalLaps}</span>
											</div>
											{i < appTimingDriver.Stints.length - 2 && (
												<div className="w-1 h-px bg-zinc-800" />
											)}
										</React.Fragment>
									);
								})}
							</div>
						</div>
					)}
				</div>
			)}
		</motion.div>
	);
}
