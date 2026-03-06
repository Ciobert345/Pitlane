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
		<div className="flex flex-col gap-6 md:gap-8 pb-4">
			{/* Desktop-like App Header */}
			<section className="flex flex-col sm:flex-row items-center sm:items-center justify-between rounded-xl border border-white/10 bg-zinc-950/60 p-4 sm:p-6 shadow-xl backdrop-blur-2xl gap-6 sm:gap-4 text-center sm:text-left">
				<div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
					<div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 shadow-inner border border-white/5 shrink-0">
						<div className="absolute inset-0 rounded-xl bg-f1-neon/10 blur-xl"></div>
						<Image src={icon} alt="Pitlane Logo" width={36} className="relative z-10 drop-shadow-lg" />
					</div>
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
							Pitlane <span className="text-f1-neon ml-1 opacity-90">Dashboard</span>
						</h1>
						<div className="flex items-center justify-center sm:justify-start gap-3">
							<span className="flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
							<p className="text-sm text-zinc-400">Alpha Build &mdash; Real-time Telemetry</p>
						</div>
					</div>
				</div>

				<div className="flex w-full sm:w-auto gap-3">
					<Link href="/dashboard" className="w-full sm:w-auto">
						<Button className="w-full sm:w-auto rounded-lg border border-f1-neon/30 bg-f1-neon/10 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:border-f1-neon/50 hover:bg-f1-neon/20 hover:shadow-[0_0_15px_rgba(225,6,0,0.15)]">
							Launch Dashboard
						</Button>
					</Link>
				</div>
			</section>

			{/* Main Grid Layout for App Content */}
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
				{/* Left Column (3/4 width) - Live Data Section */}
				<div className="lg:col-span-3 space-y-5">
					<div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 shadow-lg backdrop-blur-3xl">
						<div className="mb-4 flex items-center justify-between">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
								Live Session Status
							</p>
						</div>
						<HomeLiveSection />
					</div>
				</div>

				{/* Right Column (1/4 width) - Schedule & About info */}
				<div className="space-y-4">
					{/* Next Round Card */}
					<section className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 shadow-lg backdrop-blur-3xl flex flex-col h-auto">
						<div className="mb-3 flex items-center justify-between">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
								Next Round
							</p>
							<span className="text-[10px] text-zinc-600 font-medium">Local Time</span>
						</div>

						<div className="flex-grow">
							<Suspense fallback={<NextRoundFallback />}>
								<NextRound />
							</Suspense>
						</div>

						<Link
							href="/schedule"
							className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/5 bg-white/5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
						>
							View Full Calendar
						</Link>
					</section>

					{/* About / Credits (Condensed Desktop App Style) */}
					<section className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs">
						<div className="flex flex-col gap-2 text-zinc-500 leading-relaxed">
							<p>
								<strong className="text-zinc-300 font-medium">Pitlane</strong> by Robert Ciobanu.
								<br />
								Based on <a href="https://slowly.dev" className="text-zinc-400 hover:text-white transition-colors underline decoration-white/20 underline-offset-2">F1 Dash</a> by slowlydev.
							</p>
							<p className="text-[10px] opacity-60">
								Unofficial open-source project, not associated with Formula 1 companies.
							</p>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
