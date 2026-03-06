'use client';

import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { useWakeLock } from '@/hooks/useWakeLock';
import { useLiveData } from '@/contexts/LiveDataContext';

import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { useDataStore } from '@/stores/useDataStore';
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
	const { maxDelay } = useLiveData();
	const delay = useSettingsStore((state) => state.delay);
	const syncing = delay > maxDelay;

	useWakeLock();

	const ended = useDataStore(({ state }) => state?.SessionStatus?.Status === 'Ends');

	return (
		<div className="flex h-full w-full p-1 md:p-2 lg:p-4 min-h-0">
			<motion.div layout="size" className="flex h-full w-full flex-1 flex-col gap-2 md:gap-4 min-h-0">
				<div
					className={
						!syncing || ended ? 'w-full flex-1 md:rounded-lg overflow-hidden' : 'hidden'
					}
				>
					{children}
				</div>

				<div
					className={
						syncing && !ended
							? 'flex h-full flex-1 flex-col items-center justify-center gap-4 bg-zinc-950/20 md:rounded-lg md:border border-white/5'
							: 'hidden'
					}
				>
					<h1 className="text-center text-4xl font-black tracking-tighter text-white/90 animate-pulse">SYNCING</h1>
					<p className="text-zinc-400 font-medium">Please wait for {delay - maxDelay} seconds...</p>
					<p className="text-zinc-600 text-xs tracking-widest uppercase">Check your delay settings in the sidebar</p>
				</div>
			</motion.div>
		</div>
	);
}
