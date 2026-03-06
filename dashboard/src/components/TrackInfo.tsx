"use client";

import clsx from "clsx";

import { useDataStore } from "@/stores/useDataStore";

import { getTrackStatusMessage } from "@/lib/getTrackStatusMessage";

import { Trophy, Flag as FlagIcon } from "lucide-react";

export default function TrackInfo() {
	const lapCount = useDataStore((state) => state.state?.LapCount);
	const track = useDataStore((state) => state.state?.TrackStatus);

	const currentTrackStatus = getTrackStatusMessage(track?.Status ? parseInt(track?.Status) : undefined);

	return (
		<div className="flex h-full items-center gap-3 border-l border-white/5 pl-6">
			{!!lapCount && (
				<div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-sm">
					<div className="flex items-center justify-center size-5 rounded-full bg-white/[0.03] text-zinc-400">
						<Trophy size={11} strokeWidth={3} />
					</div>
					<div className="flex flex-col">
						<div className="flex items-baseline gap-1">
							<span className="text-xs font-black text-white leading-none tabular-nums">
								{lapCount?.CurrentLap}
							</span>
							<span className="text-[8px] font-black text-white/30 tracking-tighter uppercase leading-none">/ {lapCount?.TotalLaps}</span>
						</div>
						<span className="text-[6px] font-black uppercase tracking-widest text-white/20 leading-none mt-0.5">LAP</span>
					</div>
				</div>
			)}

			<div className="relative">
				{!!currentTrackStatus ? (
					<div
						className={clsx(
							"flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm transition-all duration-500",
							{
								"bg-green-600/5 border-green-500/20 text-green-500": currentTrackStatus.color.includes("green"),
								"bg-yellow-600/5 border-yellow-500/20 text-yellow-500": currentTrackStatus.color.includes("yellow"),
								"bg-red-600/5 border-red-500/20 text-red-500": currentTrackStatus.color.includes("red"),
								"bg-white/[0.02] border-white/5 text-zinc-400": !currentTrackStatus.color.includes("green") && !currentTrackStatus.color.includes("yellow") && !currentTrackStatus.color.includes("red"),
							}
						)}
					>
						<div className={clsx("flex items-center justify-center size-5 rounded-full bg-current/10 shadow-lg", {
							"animate-pulse": currentTrackStatus.color.includes("green"),
						})}>
							<FlagIcon size={11} strokeWidth={3} className="fill-current" />
						</div>
						<div className="flex flex-col">
							<p className="text-[10px] font-black uppercase tracking-tight text-white/90 leading-none">{currentTrackStatus.message}</p>
							<span className="text-[6px] font-black uppercase tracking-widest text-white/20 leading-none mt-0.5">STATUS</span>
						</div>
					</div>
				) : (
					<div className="h-8 w-24 animate-pulse rounded-full bg-zinc-800/40" />
				)}
			</div>
		</div>
	);
}
