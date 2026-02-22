"use client";

import { now, utc } from "moment";
import clsx from "clsx";

import type { Round as RoundType } from "@/types/schedule.type";

import { groupSessionByDay } from "@/lib/groupSessionByDay";
import { formatDayRange, formatMonth } from "@/lib/dateFormatter";
import Flag from "@/components/Flag";

type Props = {
	round: RoundType;
	nextName?: string;
};

const countryCodeMap: Record<string, string> = {
	Australia: "aus",
	Austria: "aut",
	Azerbaijan: "aze",
	Bahrain: "brn",
	Belgium: "bel",
	Brazil: "bra",
	Canada: "can",
	China: "chn",
	Spain: "esp",
	France: "fra",
	"Great Britain": "gbr",
	"United Kingdom": "gbr",
	Germany: "ger",
	Hungary: "hun",
	Italy: "ita",
	Japan: "jpn",
	"Saudi Arabia": "ksa",
	Mexico: "mex",
	Monaco: "mon",
	Netherlands: "ned",
	Portugal: "por",
	Qatar: "qat",
	Singapore: "sgp",
	"United Arab Emirates": "uae",
	"United States": "usa",
};

export default function Round({ round, nextName }: Props) {
	const countryCode = countryCodeMap[round.countryName];

	return (
		<div className={clsx("rounded-xl border border-white/5 bg-white/[0.02] p-4", round.over && "opacity-50")}>
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
				<div className="flex items-center gap-2">
					<Flag countryCode={countryCode} className="h-8 w-11" />
					<p className="text-xl font-semibold text-white">{round.countryName}</p>
					{round.name === nextName && (
						<>
							{utc().isBetween(utc(round.start), utc(round.end)) ? (
								<span className="rounded-full bg-f1-neon/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-f1-neon">
									Current
								</span>
							) : (
								<span className="rounded-full bg-f1-neon/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-f1-neon/90">
									Up Next
								</span>
							)}
						</>
					)}
					{round.over && (
						<span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Over</span>
					)}
				</div>
				<div className="flex gap-1 text-sm">
					<p className="font-medium text-zinc-200">{formatMonth(round.start, round.end)}</p>
					<p className="text-zinc-500">{formatDayRange(round.start, round.end)}</p>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-6 pt-3">
				{groupSessionByDay(round.sessions).map((day, i) => (
					<div className="flex flex-col" key={`round.day.${i}`}>
						<p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
							{utc(day.date).local().format("dddd")}
						</p>
						<div className="grid grid-rows-2 gap-2">
							{day.sessions.map((session, j) => (
								<div
									key={`round.day.${i}.session.${j}`}
									className={clsx(
										"flex flex-col rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1.5",
										!round.over && utc(session.end).isBefore(now()) && "opacity-50"
									)}
								>
									<p className="w-28 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-zinc-200 sm:w-auto">
										{session.kind}
									</p>
									<p className="text-xs leading-none text-zinc-500">
										{utc(session.start).local().format("HH:mm")} - {utc(session.end).local().format("HH:mm")}
									</p>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
