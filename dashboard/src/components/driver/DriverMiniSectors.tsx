"use client";

import React from "react";
import clsx from "clsx";

import type { TimingDataDriver, TimingStatsDriver } from "@/types/state.type";
import { useSettingsStore } from "@/stores/useSettingsStore";

type Props = {
	sectors: TimingDataDriver["Sectors"] | undefined;
	bestSectors: TimingStatsDriver["BestSectors"] | undefined;
};

export default function DriverMiniSectors({ sectors = [], bestSectors }: Props) {
	const showMiniSectors = useSettingsStore((state) => state.showMiniSectors);

	// Ensure we always have 3 slots for S1, S2, S3 to keep grid alignment
	const displaySectors = [0, 1, 2].map(i => sectors[i] || null);

	return (
		<div className="grid grid-cols-3 gap-1 h-full items-center">
			{displaySectors.map((sector, i) => {
				const isPurple = !!sector?.OverallFastest;
				const isGreen = !!sector?.PersonalFastest;
				const isYellow = !!sector?.Value && !isPurple && !isGreen;

				// Calculate progress within sector based on segments
				const segments = sector?.Segments || [];
				const completedSegments = segments.filter((s) => s && s.Status > 0).length;
				const totalSegments = segments.length;
				const progress = totalSegments > 0 ? Math.min(100, (completedSegments / totalSegments) * 100) : 0;

				return (
					<div key={`sector.${i}`} className="flex flex-col gap-0.5 border-l border-white/5 first:border-l-0 pl-1">
						<div className="flex justify-between items-baseline px-1">
							<span className="text-[7px] font-black text-zinc-700 uppercase">S{i + 1}</span>
							<span
								className={clsx("text-[11px] font-black tabular-nums tracking-tighter leading-none", {
									"text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]": isPurple,
									"text-emerald-400": isGreen,
									"text-amber-400": isYellow,
									"text-zinc-600": !sector?.Value,
								})}
							>
								{sector?.Value ? sector.Value : sector?.PreviousValue ? sector.PreviousValue : "--.---"}
							</span>
						</div>

						{/* Progress / Telemetry Bar */}
						<div className="h-1 w-full bg-zinc-900/50 rounded-full overflow-hidden">
							<div
								className={clsx("h-full transition-all duration-300", {
									"bg-violet-500 shadow-[0_0_10px_#8b5cf6]": isPurple,
									"bg-emerald-500": isGreen,
									"bg-amber-500": isYellow,
									"bg-zinc-800": !sector?.Value && progress > 0,
								})}
								style={{ width: `${progress}%` }}
							/>
						</div>

						{/* Mini-Sectors Segments */}
						{showMiniSectors && segments.length > 0 && (
							<div className="flex gap-[1px] mt-0.5 px-0.5">
								{segments.map((segment, j) => (
									<MiniSector status={segment?.Status ?? 0} key={`sector.${i}.mini.${j}`} />
								))}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

function MiniSector({ status }: { status: number }) {
	return (
		<div
			style={{ width: 6, height: 3, borderRadius: 1 }}
			className={clsx({
				"bg-amber-400": status === 2048 || status === 2052,
				"bg-emerald-500": status === 2049,
				"bg-violet-600": status === 2051,
				"bg-blue-500": status === 2064,
				"bg-zinc-700": status === 0,
			})}
		/>
	);
}
