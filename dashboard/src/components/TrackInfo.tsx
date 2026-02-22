"use client";

import clsx from "clsx";

import { useDataStore } from "@/stores/useDataStore";

import { getTrackStatusMessage } from "@/lib/getTrackStatusMessage";

export default function TrackInfo() {
	const lapCount = useDataStore((state) => state.state?.LapCount);
	const track = useDataStore((state) => state.state?.TrackStatus);

	const currentTrackStatus = getTrackStatusMessage(track?.Status ? parseInt(track?.Status) : undefined);

	return (
		<div className="flex h-full items-center gap-8 border-l border-white/10 pl-8">
			{!!lapCount && (
				<div className="flex flex-col items-center justify-center gap-0.5">
					<span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-600 leading-none mb-0.5">LAP PROGRESS</span>
					<div className="flex items-baseline gap-1.5">
						<p className="text-2xl font-black tabular-nums text-white leading-none">
							{lapCount?.CurrentLap}
						</p>
						<span className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">/ {lapCount?.TotalLaps}</span>
					</div>
				</div>
			)}

			<div className="flex flex-col items-center justify-center gap-1.5 border-l border-white/10 pl-8">
				<span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-600 leading-none">TRACK STATUS</span>
				{!!currentTrackStatus ? (
					<div
						className={clsx(
							"flex h-6 items-center rounded border px-3 transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]",
							{
								"bg-green-600/10 border-green-500/50 text-green-500": currentTrackStatus.color.includes("green"),
								"bg-yellow-600/10 border-yellow-500/50 text-yellow-500": currentTrackStatus.color.includes("yellow"),
								"bg-red-600/10 border-red-500/50 text-red-500": currentTrackStatus.color.includes("red"),
								"bg-zinc-800 border-zinc-700 text-zinc-400": !currentTrackStatus.color.includes("green") && !currentTrackStatus.color.includes("yellow") && !currentTrackStatus.color.includes("red"),
							}
						)}
					>
						<div className={clsx("h-1.5 w-1.5 rounded-full mr-2 shadow-lg", {
							"bg-green-500 shadow-green-500/50": currentTrackStatus.color.includes("green"),
							"bg-yellow-500 shadow-yellow-500/50": currentTrackStatus.color.includes("yellow"),
							"bg-red-500 shadow-red-500/50": currentTrackStatus.color.includes("red"),
							"bg-zinc-500": !currentTrackStatus.color.includes("green") && !currentTrackStatus.color.includes("yellow") && !currentTrackStatus.color.includes("red"),
						})} />
						<p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">{currentTrackStatus.message}</p>
					</div>
				) : (
					<div className="h-6 w-24 animate-pulse rounded bg-zinc-800/50" />
				)}
			</div>
		</div>
	);
}
