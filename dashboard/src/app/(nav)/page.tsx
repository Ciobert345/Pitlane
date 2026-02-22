import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import Button from "@/components/ui/Button";
import HomeLiveSection from "@/components/home/HomeLiveSection";
import NextRound from "@/components/schedule/NextRound";

import icon from "public/icone/Pitlane.png";

function NextRoundFallback() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div className="h-32 animate-pulse rounded-xl bg-white/5" />
			<div className="h-32 animate-pulse rounded-xl bg-white/5" />
		</div>
	);
}

export default function Home() {
	return (
		<div className="flex flex-col gap-10 md:gap-14">
			{/* Hero */}
			<section className="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/40 px-6 py-12 shadow-2xl backdrop-blur-3xl md:py-16">
				<div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-f1-neon/50 to-transparent shadow-[0_1px_10px_rgba(225,6,0,0.3)]" />
				<span className="absolute right-4 top-4 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
					Alpha
				</span>
				<Image src={icon} alt="Pitlane" width={140} className="opacity-95 md:w-[180px]" />
				<h1 className="mt-8 mb-6 text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
					Real-time Formula 1{" "}
					<span className="bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
						telemetry and timing
					</span>
				</h1>
				<p className="mb-6 text-center text-sm text-zinc-500">
					Questa dashboard è in fase <strong className="text-amber-400/90">alpha</strong>: funzionalità e interfaccia possono cambiare.
				</p>
				<div className="flex flex-wrap justify-center gap-3">
					<Link href="/dashboard">
						<Button className="rounded-xl border-2 border-f1-neon/30 bg-f1-neon/10 px-5 py-3 font-semibold text-white shadow-lg transition-all hover:border-f1-neon/50 hover:bg-f1-neon/20 hover:shadow-[0_0_20px_rgba(225,6,0,0.2)]">
							Dashboard
						</Button>
					</Link>
					<Link href="/schedule">
						<Button className="rounded-xl border-2 border-white/10 bg-white/5 px-5 py-3 font-medium text-zinc-200 transition-all hover:border-white/20 hover:bg-white/10">
							Schedule
						</Button>
					</Link>
				</div>
			</section>

			{/* Live: componenti reali (Session, Weather, Track, Connection) */}
			<HomeLiveSection />

			{/* Prossimo GP: dati reali da API schedule */}
			<section className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 shadow-2xl backdrop-blur-3xl md:p-6">
				<p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
					Prossimo GP
				</p>
				<p className="mt-0.5 text-xs text-zinc-500">Orari in ora locale</p>
				<div className="mt-4">
					<Suspense fallback={<NextRoundFallback />}>
						<NextRound />
					</Suspense>
				</div>
				<Link
					href="/schedule"
					className="mt-4 flex justify-center rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
				>
					Vedi calendario completo
				</Link>
			</section>

			{/* Credito: Robert Ciobanu, basato su F1 Dash di slowlydev */}
			<section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 md:p-8">
				<p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
					About
				</p>
				<p className="mt-4 text-sm leading-relaxed text-zinc-400">
					<strong className="text-zinc-300">Pitlane</strong> è stato realizzato da{" "}
					<strong className="text-zinc-300">Robert Ciobanu</strong>, che ha scelto di basarsi sulla dashboard{" "}
					<strong className="text-zinc-300">F1 Dash</strong> ideata e sviluppata da{" "}
					<a
						href="https://slowly.dev"
						className="font-medium text-f1-neon underline decoration-f1-neon/40 underline-offset-2 hover:text-f1-neon/90"
					>
						slowlydev
					</a>
					. F1 Dash è un&apos;applicazione open source per il live timing e la telemetria in tempo reale di Formula 1;
					Pitlane ne riprende l&apos;idea e l&apos;architettura, adattandola e estendendola.
				</p>
				<p className="mt-3 text-xs text-zinc-500">
					Progetto non ufficiale, non associato a Formula 1 companies. F1, FORMULA ONE e marchi correlati sono
					trademark di Formula One Licensing B.V.
				</p>
			</section>
		</div>
	);
}
