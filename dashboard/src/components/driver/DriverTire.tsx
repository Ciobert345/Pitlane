"use client";

import React from "react";
import Image from "next/image";
import type { TimingAppDataDriver } from "@/types/state.type";

type Props = {
	stints: TimingAppDataDriver["Stints"] | undefined;
	pitstops?: number;
	mode?: "all" | "icon" | "stats";
};

export default function DriverTire({ stints = [], pitstops, mode = "all" }: Props) {
	// Guard against undefined or empty stints
	const currentStint = stints && stints.length > 0 ? stints[stints.length - 1] : null;
	const laps = currentStint?.TotalLaps ?? 0;

	// Fallback to stints length if pitstops prop is not provided. 
	// Ensure result is never negative.
	const actualPitstops = pitstops !== undefined
		? Math.max(0, pitstops)
		: (stints && stints.length > 0 ? Math.max(0, stints.length - 1) : 0);

	const compound = currentStint?.Compound?.toLowerCase() ?? "unknown";
	const unknownCompound = !["soft", "medium", "hard", "intermediate", "wet"].includes(compound);
	const isNew = currentStint?.New === "TRUE";

	return (
		<div className="flex items-center gap-2">
			{(mode === "all" || mode === "icon") && (
				<div className="relative shrink-0">
					<Image
						src={"/tires/" + (unknownCompound ? "unknown" : compound) + ".svg"}
						width={28}
						height={28}
						alt={compound}
						className="drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
					/>
					{!isNew && (
						<span className="absolute -top-1 -right-1 text-[10px] font-black text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)] pointer-events-none">*</span>
					)}
				</div>
			)}

			{(mode === "all" || mode === "stats") && (
				<div className="flex flex-col justify-center leading-tight">
					<div className="flex items-baseline gap-0.5">
						<p className="text-[13px] font-black tabular-nums text-white">{laps}</p>
						<span className="text-[7px] font-bold uppercase text-zinc-600">L</span>
					</div>
					<p className="text-[8px] font-bold uppercase text-zinc-500 opacity-80 whitespace-nowrap">
						{actualPitstops} {actualPitstops === 1 ? 'STOP' : 'STOPS'}
					</p>
				</div>
			)}
		</div>
	);
}
