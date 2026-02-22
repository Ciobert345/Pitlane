import { Suspense } from "react";

import NextRound from "@/components/schedule/NextRound";
import Schedule from "@/components/schedule/Schedule";

const sectionTitleClass =
	"text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 bg-gradient-to-r from-zinc-400 to-zinc-600 bg-clip-text text-transparent opacity-90";

export default async function SchedulePage() {
	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<div className="glass-card rounded-2xl p-4 md:p-6">
				<p className={sectionTitleClass}>Up Next</p>
				<p className="mt-0.5 text-xs text-zinc-500">Local time</p>
				<div className="mt-4">
					<Suspense fallback={<NextRoundLoading />}>
						<NextRound />
					</Suspense>
				</div>
			</div>

			<div className="glass-card rounded-2xl p-4 md:p-6">
				<p className={sectionTitleClass}>Full Schedule</p>
				<p className="mt-0.5 text-xs text-zinc-500">Local time</p>
				<div className="mt-4">
					<Suspense fallback={<FullScheduleLoading />}>
						<Schedule />
					</Suspense>
				</div>
			</div>
		</div>
	);
}

const RoundLoading = () => (
	<div className="flex flex-col gap-1">
		<div className="h-10 w-full animate-pulse rounded-xl bg-white/5" />
		<div className="grid grid-cols-3 gap-4 pt-1">
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={`day.${i}`} className="grid grid-rows-2 gap-1.5">
					<div className="h-10 w-full animate-pulse rounded-lg bg-white/5" />
					<div className="h-10 w-full animate-pulse rounded-lg bg-white/5" />
				</div>
			))}
		</div>
	</div>
);

const NextRoundLoading = () => (
	<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div className="flex flex-col gap-3">
			<div className="h-24 w-3/4 animate-pulse rounded-xl bg-white/5" />
			<div className="h-24 w-3/4 animate-pulse rounded-xl bg-white/5" />
		</div>
		<RoundLoading />
	</div>
);

const FullScheduleLoading = () => (
	<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
		{Array.from({ length: 6 }).map((_, i) => (
			<RoundLoading key={`round.${i}`} />
		))}
	</div>
);
