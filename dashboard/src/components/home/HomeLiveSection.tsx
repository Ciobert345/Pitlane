"use client";

import Link from "next/link";

import { useLiveData } from "@/contexts/LiveDataContext";
import SessionInfo from "@/components/SessionInfo";
import WeatherInfo from "@/components/WeatherInfo";
import TrackInfo from "@/components/TrackInfo";
import ConnectionStatus from "@/components/ConnectionStatus";

export default function HomeLiveSection() {
	const { connected } = useLiveData();

	return (
		<section className="rounded-2xl border border-white/10 bg-zinc-950/40 shadow-2xl backdrop-blur-3xl overflow-hidden">
			<div className="border-b border-white/5 px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
				<span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
					Live now
				</span>
				<ConnectionStatus connected={connected} />
			</div>
			<div className="p-4 md:p-6">
				<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:flex-wrap">
					<SessionInfo />
					<WeatherInfo />
					<TrackInfo />
				</div>
				<Link
					href="/dashboard"
					className="mt-6 flex w-full items-center justify-center rounded-xl border border-f1-neon/30 bg-f1-neon/10 py-3 text-sm font-semibold text-white transition-all hover:bg-f1-neon/20"
				>
					Open full dashboard
				</Link>
			</div>
		</section>
	);
}
