import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { utc } from "moment";
import clsx from "clsx";

import type { Driver, RadioCapture } from "@/types/state.type";

import { useSettingsStore } from "@/stores/useSettingsStore";

import { toTrackTime } from "@/lib/toTrackTime";

import DriverTag from "@/components/driver/DriverTag";

type Props = {
	driver: Driver;
	capture: RadioCapture;
	basePath: string;
	gmtOffset: string;
};

export default function RadioMessage({ driver, capture, basePath, gmtOffset }: Props) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [playing, setPlaying] = useState<boolean>(false);
	const [duration, setDuration] = useState<number>(0);
	const [progress, setProgress] = useState<number>(0);
	const [isDragging, setIsDragging] = useState<boolean>(false);



	const togglePlayback = () => {
		if (!audioRef.current) return;
		if (playing) {
			audioRef.current.pause();
		} else {
			audioRef.current.play().catch(console.error);
		}
	};

	const handleTimeUpdate = () => {
		if (audioRef.current && !isDragging) {
			setProgress(audioRef.current.currentTime);
		}
	};

	const handleLoadedMetadata = () => {
		if (audioRef.current) {
			setDuration(audioRef.current.duration);
		}
	};

	const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = parseFloat(e.target.value);
		if (audioRef.current) {
			audioRef.current.currentTime = val;
			setProgress(val);
		}
	};

	const favoriteDriver = useSettingsStore((state) => state.favoriteDrivers.includes(driver.RacingNumber));
	const localTime = utc(capture.Utc).local().format("HH:mm:ss");
	const trackTime = utc(toTrackTime(capture.Utc, gmtOffset)).format("HH:mm");
	const teamColor = `#${driver.TeamColour || "888"}`;

	return (
		<motion.li
			animate={{ opacity: 1, x: 0 }}
			initial={{ opacity: 0, x: -10 }}
			className={clsx(
				"group relative flex items-center gap-3 rounded-lg border border-white/5 p-2 transition-colors",
				favoriteDriver ? "bg-sky-500/5 border-sky-500/10" : "bg-black/20 hover:bg-black/40"
			)}
		>
			{/* Team Accent Bar */}
			<div
				className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg opacity-60"
				style={{ backgroundColor: teamColor }}
			/>

			<DriverTag className="!w-fit !h-8 border-none bg-zinc-900/50 shrink-0" teamColor={driver.TeamColour} short={driver.Tla} />

			<button
				onClick={togglePlayback}
				className={clsx(
					"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
					playing
						? "border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
						: "border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
				)}
			>
				{playing ? (
					<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
						<rect x="6" y="4" width="3" height="16" rx="1" />
						<rect x="15" y="4" width="3" height="16" rx="1" />
					</svg>
				) : (
					<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="ml-1">
						<path d="M7 4v16l12-8z" strokeLinejoin="round" />
					</svg>
				)}
			</button>

			<div className="flex-1 flex flex-col gap-1 min-w-0">
				<div className="relative h-1 w-full bg-zinc-800/50 rounded-full overflow-hidden">
					<div
						className={clsx("absolute h-full bg-white/30", !isDragging && "transition-all duration-100")}
						style={{ width: `${(progress / (duration || 1)) * 100}%` }}
					/>
					<input
						type="range"
						min="0"
						max={duration || 100}
						step="0.01"
						value={progress}
						onChange={handleSeek}
						onMouseDown={() => setIsDragging(true)}
						onMouseUp={() => setIsDragging(false)}
						onMouseLeave={() => setIsDragging(false)}
						onTouchStart={() => setIsDragging(true)}
						onTouchEnd={() => setIsDragging(false)}
						className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent accent-white opacity-0 focus:opacity-100 transition-opacity"
					/>
				</div>
				<div className="flex justify-between items-center text-[8px] font-bold tabular-nums text-zinc-600">
					<span>{new Date(progress * 1000).toISOString().substr(14, 5)}</span>
					<span>{duration ? new Date(duration * 1000).toISOString().substr(14, 5) : "--:--"}</span>
				</div>
			</div>

			<div className="flex flex-col items-end gap-0.5 shrink-0 opacity-60">
				<span className="text-[8px] font-black tracking-tighter text-zinc-400 uppercase">
					{trackTime}
				</span>
				<span className="text-[8px] font-bold tabular-nums text-zinc-500 uppercase">
					{localTime}
				</span>
			</div>

			<audio
				preload="none"
				src={`${basePath}${capture.Path}`}
				ref={audioRef}
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onEnded={() => { setPlaying(false); setProgress(0); }}
				onTimeUpdate={handleTimeUpdate}
				onLoadedMetadata={handleLoadedMetadata}
			/>
		</motion.li>
	);
}
