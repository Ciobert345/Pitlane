"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";

const HOVER_OPEN_DELAY_MS = 450;
const HOVER_CLOSE_DELAY_MS = 250;

import { useSidebarStore } from "@/stores/useSidebarStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

import ConnectionStatus from "@/components/ConnectionStatus";
import DelayInput from "@/components/DelayInput";
import SidenavButton from "@/components/SidenavButton";
import DelayTimer from "@/components/DelayTimer";

const liveTimingItems = [
	{
		href: "/dashboard",
		name: "Dashboard",
	},
	{
		href: "/dashboard/standings",
		name: "Standings",
	},
	{
		href: "/live",
		name: "Live",
	},
];

type Props = {
	connected: boolean;
};

export default function Sidebar({ connected }: Props) {
	// const favoriteDrivers = useSettingsStore((state) => state.favoriteDrivers);
	// const drivers = useDataStore((state) => state.driverList);

	// const driverItems = drivers
	// 	? favoriteDrivers.map((nr) => ({
	// 			href: `/dashboard/driver/${nr}`,
	// 			name: drivers[nr].fullName,
	// 		}))
	// 	: null;

	const { opened, pinned } = useSidebarStore();
	const close = useSidebarStore((state) => state.close);
	const open = useSidebarStore((state) => state.open);

	const pin = useSidebarStore((state) => state.pin);
	const unpin = useSidebarStore((state) => state.unpin);

	const oledMode = useSettingsStore((state) => state.oledMode);

	const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleHoverStart = () => {
		if (pinned) return;
		closeTimeoutRef.current && clearTimeout(closeTimeoutRef.current);
		closeTimeoutRef.current = null;
		openTimeoutRef.current = setTimeout(() => open(), HOVER_OPEN_DELAY_MS);
	};

	const handleHoverEnd = () => {
		if (pinned) return;
		openTimeoutRef.current && clearTimeout(openTimeoutRef.current);
		openTimeoutRef.current = null;
		closeTimeoutRef.current = setTimeout(() => close(), HOVER_CLOSE_DELAY_MS);
	};

	useEffect(() => {
		return () => {
			openTimeoutRef.current && clearTimeout(openTimeoutRef.current);
			closeTimeoutRef.current && clearTimeout(closeTimeoutRef.current);
		};
	}, []);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 768) {
				unpin();
			}
		};

		window.addEventListener("resize", handleResize);
		handleResize();

		return () => window.removeEventListener("resize", handleResize, false);
	}, [unpin]);

	return (
		<div className="h-full flex flex-shrink-0 relative">
			{/* Spacer for pinned state */}
			<motion.div
				className="hidden md:block"
				initial={false}
				animate={{ width: pinned ? 260 : 0 }}
				transition={{ type: "spring", damping: 30, stiffness: 200 }}
			/>

			<AnimatePresence>
				{opened && (
					<motion.div
						onTouchEnd={() => close()}
						className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md md:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					/>
				)}
			</AnimatePresence>

			{/* Invisible Hover Trigger Area (only when not pinned) */}
			{!pinned && (
				<div
					className="fixed top-0 left-0 z-[80] h-full w-[12px] bg-transparent"
					onMouseEnter={handleHoverStart}
				/>
			)}

			<motion.div
				className="no-scrollbar h-full flex overflow-y-auto w-[260px] absolute top-0 left-0 z-[75]"
				onHoverEnd={!pinned ? handleHoverEnd : undefined}
				initial={false}
				animate={{ x: pinned || opened ? 0 : -260 }}
				transition={{ type: "spring", damping: 30, stiffness: 200 }}
			>
				{/* Inner actual visual sidebar */}
				<nav
					className={clsx("flex w-full flex-col p-4 transition-[border-radius,height,margin,background,width] duration-500 ease-in-out", {
						"my-2 ml-2 h-[calc(100%-16px)] glass bg-zinc-950/80 backdrop-blur-3xl rounded-2xl border border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.8),_0_0_20px_rgba(255,255,255,0.05),_inset_0_1px_1px_rgba(255,255,255,0.1)]": !pinned,
						"h-full bg-black/95 backdrop-blur-3xl border-r border-f1-neon/30": pinned && oledMode,
						"h-full bg-gradient-to-b from-zinc-950/95 to-black/95 backdrop-blur-3xl border-r border-white/10 shadow-[20px_0_40px_rgba(0,0,0,0.4)]": pinned && !oledMode,
					})}
				>
					<div className="flex items-center justify-between gap-2 mb-6">
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-1.5 glass bg-white/5 rounded-full px-2 py-1">
								<DelayInput saveDelay={500} />
								<DelayTimer />
							</div>

							<ConnectionStatus connected={connected} />
						</div>

						<SidenavButton
							className="hidden md:flex glass items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]"
							onClick={() => (pinned ? unpin() : pin())}
						/>
						<SidenavButton
							className="md:hidden glass items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all shadow-md"
							onClick={() => close()}
						/>
					</div>

					<div className="space-y-6">
						<section>
							<p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 bg-gradient-to-r from-zinc-400 to-zinc-600 bg-clip-text text-transparent opacity-90 drop-shadow-sm">
								Live Timing
							</p>
							<div className="flex flex-col gap-1">
								{liveTimingItems.map((item) => (
									<Item key={item.href} item={item} />
								))}
							</div>
						</section>

						<section>
							<p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 bg-gradient-to-r from-zinc-400 to-zinc-600 bg-clip-text text-transparent opacity-90 drop-shadow-sm">
								General
							</p>
							<div className="flex flex-col gap-1">
								<Item item={{ href: "/dashboard/settings", name: "Settings" }} />
								<Item item={{ href: "/schedule", name: "Schedule" }} />
								<Item item={{ href: "/", name: "Home" }} />
							</div>
						</section>
					</div>

					{/* Spacer to push credits to the bottom if needed, or just standard mt */}
					<div className="mt-auto pt-8">
						<p className="px-3 text-[9px] font-black uppercase tracking-widest text-zinc-500/60 leading-relaxed">
							Pitlane by Robert Ciobanu.<br />
							Based on F1 Dash by slowlydev.
						</p>
					</div>
				</nav>
			</motion.div>
		</div >
	);
}

type ItemProps = {
	target?: string;
	item: { href: string; name: string };
};

const Item = ({ target, item }: ItemProps) => {
	const active = usePathname() === item.href;

	return (
		<Link href={item.href} target={target}>
			<motion.div
				whileHover={{ x: 6, backgroundColor: active ? "transparent" : "rgba(255,255,255,0.06)" }}
				whileTap={{ scale: 0.96 }}
				className={clsx(
					"group relative flex items-center rounded-xl p-2.5 px-3 transition-all duration-300 overflow-hidden",
					{
						"bg-gradient-to-r from-f1-neon/10 to-transparent text-white shadow-md border border-f1-neon/20": active,
						"text-zinc-400 border border-transparent": !active,
					}
				)}
			>
				{active && (
					<motion.div
						layoutId="active-pill"
						className="absolute top-1/2 -content -translate-y-1/2 left-0 h-[60%] w-1 rounded-r-full bg-f1-neon shadow-[0_0_12px_rgba(225,6,0,0.8)]"
						transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
					/>
				)}
				<span className={clsx("relative z-10 text-sm tracking-wide transition-colors", {
					"font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]": active,
					"font-medium group-hover:text-zinc-100": !active
				})}>
					{item.name}
				</span>
			</motion.div>
		</Link>
	);
};
