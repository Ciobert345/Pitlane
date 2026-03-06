import { useState } from "react";
import { AnimatePresence } from "motion/react";
import clsx from "clsx";

import { useDataStore } from "@/stores/useDataStore";

import { sortUtc } from "@/lib/sorting";

import RadioMessage from "@/components/dashboard/RadioMessage";

export default function TeamRadios() {
	const drivers = useDataStore((state) => state.state?.DriverList);
	const teamRadios = useDataStore((state) => state.state?.TeamRadio);
	const sessionPath = useDataStore((state) => state.state?.SessionInfo?.Path);
	const gmtOffset = useDataStore((state) => state.state?.SessionInfo?.GmtOffset);

	const basePath = `https://livetiming.formula1.com/static/${sessionPath}`;

	const allCaptures = (teamRadios?.Captures || []).sort(sortUtc).slice(0, 20);

	return (
		<div className="flex flex-col h-full min-h-0">
			{/* HUD Header */}
			<div className="flex items-center justify-between px-1 mb-2">
				<div className="flex items-center gap-2">
					<div className="h-1 w-3 rounded-full bg-f1-accent" />
					<span className="text-[10px] font-black uppercase tracking-widest text-white">Live Log</span>
				</div>
				<div className="flex items-center gap-4">
					<span className="text-[9px] font-bold text-zinc-500 uppercase">Latest 20</span>
				</div>
			</div>

			<ul className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto no-scrollbar scroll-smooth pr-1">
				{!teamRadios && new Array(6).fill("").map((_, index) => <SkeletonMessage key={`radio.loading.${index}`} />)}

				{allCaptures.length > 0 && gmtOffset && (
					<AnimatePresence initial={false}>
						{allCaptures.map((teamRadio) => {
							const driver = drivers ? drivers[teamRadio.RacingNumber] : null;

							if (!driver) return null;

							return (
								<RadioMessage
									key={teamRadio.Utc}
									driver={driver as any}
									capture={teamRadio}
									basePath={basePath}
									gmtOffset={gmtOffset}
								/>
							);
						})}
					</AnimatePresence>
				)}
			</ul>
		</div>
	);
}

const SkeletonMessage = () => {
	const animateClass = "h-6 animate-pulse rounded-md bg-zinc-800";

	return (
		<li className="flex flex-col gap-1 p-2">
			<div className={clsx(animateClass, "h-4! w-16")} />

			<div
				className="grid place-items-center items-center gap-2 md:gap-4"
				style={{
					gridTemplateColumns: "3rem 1fr",
				}}
			>
				<div className="place-self-start">
					<div className={clsx(animateClass, "h-8! w-12 md:w-14")} />
				</div>

				<div className="flex items-center gap-2 md:gap-4 w-full">
					<div className={clsx(animateClass, "h-6 w-6 shrink-0")} />
					<div className={clsx(animateClass, "h-2! flex-1")} />
				</div>
			</div>
		</li>
	);
};
