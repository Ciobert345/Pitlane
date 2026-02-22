"use client";

import React from "react";
import clsx from "clsx";

import type { TimingDataDriver } from "@/types/state.type";

type Props = {
	timingDriver: TimingDataDriver;
	sessionPart: number | undefined;
};

export default function DriverGap({ timingDriver, sessionPart }: Props) {
	// Defensive check for stats array existence and bounds
	const stats = timingDriver?.Stats;
	const safeSessionPart = typeof sessionPart === 'number' ? sessionPart : 0;
	const statsEntry = (stats && stats.length > 0)
		? (stats[safeSessionPart - 1] || stats[stats.length - 1])
		: undefined;

	const gapToLeader =
		timingDriver?.GapToLeader ??
		statsEntry?.TimeDiffToFastest ??
		timingDriver?.TimeDiffToFastest ??
		"";

	const gapToFront =
		timingDriver?.IntervalToPositionAhead?.Value ??
		statsEntry?.TimeDifftoPositionAhead ??
		timingDriver?.TimeDiffToPositionAhead ??
		"";

	const catching = timingDriver?.IntervalToPositionAhead?.Catching ?? false;

	return (
		<div className="flex flex-col items-center gap-1 leading-tight">
			<p
				className={clsx("text-[13px] font-black tabular-nums", {
					"text-emerald-400": catching,
					"text-zinc-600": !gapToFront,
					"text-white": !!gapToFront && !catching,
				})}
			>
				{gapToFront ? String(gapToFront) : "-- ---"}
			</p>

			<p className="text-[10px] text-zinc-500 tabular-nums font-bold">
				{gapToLeader ? (String(gapToLeader).startsWith("+") ? gapToLeader : `+${gapToLeader}`) : "-- ---"}
			</p>
		</div>
	);
}
