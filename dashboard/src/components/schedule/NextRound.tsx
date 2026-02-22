import { connection } from "next/server";
import { utc } from "moment";

import Countdown from "@/components/schedule/Countdown";
import Round from "@/components/schedule/Round";

import { env } from "@/env";
import type { Round as RoundType } from "@/types/schedule.type";

export const getNext = async () => {
	await connection();

	try {
		const nextReq = await fetch(`${env.API_URL}/api/schedule/next`, {
			cache: "no-store",
		});
		const next: RoundType = await nextReq.json();

		return next;
	} catch (e) {
		if (process.env.NODE_ENV !== "production") {
			const message = e instanceof Error ? e.message : String(e);
			console.warn("error fetching next round:", message);
		}
		return null;
	}
};

export default async function NextRound() {
	const next = await getNext();

	if (!next) {
		return (
			<div className="flex h-44 flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-4">
				<p className="text-zinc-500">No upcoming weekend found</p>
			</div>
		);
	}

	const nextSession = next.sessions.filter((s) => utc(s.start) > utc() && s.kind.toLowerCase() !== "race")[0];
	const nextRace = next.sessions.find((s) => s.kind.toLowerCase() == "race");

	return (
		<div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
			{nextSession || nextRace ? (
				<div className="flex flex-col gap-4">
					{nextSession && <Countdown next={nextSession} type="other" />}
					{nextRace && <Countdown next={nextRace} type="race" />}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-4">
					<p className="text-zinc-500">No upcoming sessions found</p>
				</div>
			)}

			<Round round={next} />
		</div>
	);
}
