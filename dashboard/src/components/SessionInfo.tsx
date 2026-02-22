"use client";

import { utc, duration } from "moment";

import { useDataStore } from "@/stores/useDataStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

import Flag from "@/components/Flag";

const sessionPartPrefix = (name: string) => {
	switch (name) {
		case "Sprint Qualifying":
			return "SQ";
		case "Qualifying":
			return "Q";
		default:
			return "";
	}
};

export default function SessionInfo() {
	const clock = useDataStore((state) => state.state?.ExtrapolatedClock);
	const session = useDataStore((state) => state.state?.SessionInfo);
	const timingData = useDataStore((state) => state.state?.TimingData);

	const delay = useSettingsStore((state) => state.delay);

	const timeRemaining =
		!!clock && !!clock.Remaining
			? clock.Extrapolating
				? utc(
					duration(clock.Remaining)
						.subtract(utc().diff(utc(clock.Utc)))
						.asMilliseconds() + (delay ? delay * 1000 : 0),
				).format("HH:mm:ss")
				: clock.Remaining
			: undefined;

	return (
		<div className="flex items-center gap-6">
			<div className="shrink-0 scale-125">
				<Flag countryCode={session?.Meeting.Country.Code} />
			</div>

			<div className="flex flex-col justify-center gap-0.5">
				{session ? (
					<div className="flex flex-col">
						<span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 leading-none mb-1">
							{session.Meeting.Name}
						</span>
						<div className="flex items-center gap-2">
							<span className="h-3 w-1 rounded-full bg-f1-neon shadow-[0_0_8px_rgba(225,6,0,0.4)]" />
							<h1 className="truncate text-sm font-black text-white uppercase tracking-widest leading-none">
								{session.Name ?? "Unknown"}
								{timingData?.SessionPart ? ` ${sessionPartPrefix(session.Name)}${timingData.SessionPart}` : ""}
							</h1>
						</div>
					</div>
				) : (
					<div className="h-3 w-40 animate-pulse rounded bg-zinc-800/50" />
				)}
			</div>

			<div className="flex flex-col items-center justify-center border-l border-white/10 pl-6 ml-2">
				{timeRemaining !== undefined ? (
					<div className="flex flex-col items-end">
						<span className="text-[8px] font-black uppercase tracking-[0.3em] text-f1-neon mb-1">Session Timer</span>
						<p className="text-4xl font-black tabular-nums tracking-tighter text-white leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
							{timeRemaining}
						</p>
					</div>
				) : (
					<div className="h-8 w-24 animate-pulse rounded bg-zinc-800/50" />
				)}
			</div>
		</div>
	);
}
