import { connection } from "next/server";

import Round from "@/components/schedule/Round";

import type { Round as RoundType } from "@/types/schedule.type";

import { env } from "@/env";

export const getSchedule = async () => {
	await connection();

	try {
		const scheduleReq = await fetch(`${env.API_URL}/api/schedule`, {
			cache: "no-store",
		});
		if (!scheduleReq.ok) return null;
		const schedule: RoundType[] = await scheduleReq.json();
		if (!Array.isArray(schedule)) return null;
		return schedule;
	} catch (e) {
		console.error("error fetching schedule", e);
		return null;
	}
};

export default async function Schedule() {
	const schedule = await getSchedule();

	if (!schedule) {
		return (
			<div className="flex h-44 flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-4">
				<p className="text-zinc-500">Schedule not found</p>
			</div>
		);
	}

	const next = schedule.filter((round) => !round.over)[0];

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
			{schedule.map((round, roundI) => (
				<Round nextName={next?.name} round={round} key={`round.${roundI}`} />
			))}
		</div>
	);
}
