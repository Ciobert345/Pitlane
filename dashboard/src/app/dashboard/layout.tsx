'use client';

import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { useWakeLock } from '@/hooks/useWakeLock';
import { useLiveData } from '@/contexts/LiveDataContext';

import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { useDataStore } from '@/stores/useDataStore';

import Sidebar from '@/components/Sidebar';
import SidenavButton from '@/components/SidenavButton';
import SessionInfo from '@/components/SessionInfo';
import WeatherInfo from '@/components/WeatherInfo';
import TrackInfo from '@/components/TrackInfo';
import DelayInput from '@/components/DelayInput';
import DelayTimer from '@/components/DelayTimer';
import ConnectionStatus from '@/components/ConnectionStatus';

type Props = {
	children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
	const { connected, maxDelay } = useLiveData();
	const delay = useSettingsStore((state) => state.delay);
	const syncing = delay > maxDelay;

	useWakeLock();

	const ended = useDataStore(({ state }) => state?.SessionStatus?.Status === 'Ends');

	return (
		<div className="flex h-screen w-full md:pt-2 md:pr-2 md:pb-2">
			<Sidebar key="sidebar" connected={connected} />

			<motion.div layout="size" className="flex h-full w-full flex-1 flex-col md:gap-2">
				<DesktopStaticBar show={!syncing || ended} />
				<MobileStaticBar show={!syncing || ended} connected={connected} />

				<div
					className={
						!syncing || ended ? 'w-full flex-1 overflow-auto md:rounded-lg' : 'hidden'
					}
				>
					<MobileDynamicBar />
					{children}
				</div>

				<div
					className={
						syncing && !ended
							? 'flex h-full flex-1 flex-col items-center justify-center gap-2 border-zinc-800 md:rounded-lg md:border'
							: 'hidden'
					}
				>
					<h1 className="my-20 text-center text-5xl font-bold">Syncing...</h1>
					<p>Please wait for {delay - maxDelay} seconds.</p>
					<p>Or make your delay smaller.</p>
				</div>
			</motion.div>
		</div>
	);
}

function MobileDynamicBar() {
	return (
		<div className="flex flex-col divide-y divide-zinc-800 border-b border-zinc-800 md:hidden">
			<div className="p-2">
				<SessionInfo />
			</div>
			<div className="p-2">
				<WeatherInfo />
			</div>
		</div>
	);
}

function MobileStaticBar({ show, connected }: { show: boolean; connected: boolean }) {
	const open = useSidebarStore((state) => state.open);

	return (
		<div className="flex w-full items-center justify-between overflow-hidden border-b border-zinc-800 p-2 md:hidden">
			<div className="flex items-center gap-2">
				<SidenavButton key="mobile" onClick={() => open()} />

				<DelayInput saveDelay={500} />
				<DelayTimer />

				<ConnectionStatus connected={connected} />
			</div>

			{show && <TrackInfo />}
		</div>
	);
}

function DesktopStaticBar({ show }: { show: boolean }) {
	const pinned = useSidebarStore((state) => state.pinned);
	const pin = useSidebarStore((state) => state.pin);

	return (
		<div className="hidden w-full items-center justify-between overflow-hidden rounded-2xl border border-white/5 border-t-f1-neon/30 bg-zinc-950/40 px-6 py-4 md:flex shadow-2xl backdrop-blur-3xl relative">
			{/* Subtle glow effect for the navbar */}
			<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-f1-neon/50 to-transparent shadow-[0_1px_10px_rgba(225,6,0,0.3)]" />
			<div className="flex items-center gap-6">
				<div className="flex items-center min-w-[40px]">
					<AnimatePresence mode="wait">
						{!pinned && (
							<motion.div
								key="side-btn"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="shrink-0"
							>
								<SidenavButton
									key="desktop"
									onClick={() => pin()}
									className="glass flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]"
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<motion.div key="session-info" layout="position" className="flex items-center">
					<SessionInfo />
				</motion.div>
			</div>

			<div className="flex items-center gap-6">
				{show && (
					<>
						<WeatherInfo />
						<TrackInfo />
					</>
				)}
			</div>
		</div>
	);
}
