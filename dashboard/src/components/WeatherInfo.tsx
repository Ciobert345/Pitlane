"use client";

import { clamping, describeArc, polarToCartesian } from "@/lib/circle";
import { getWindDirection } from "@/lib/getWindDirection";
import { useDataStore } from "@/stores/useDataStore";
import clsx from "clsx";
import { Thermometer, Wind, Droplets, CloudRain } from "lucide-react";

/** A premium status pill for the header */
function StatusPill({
	icon: Icon,
	value,
	unit,
	label,
	color,
	className,
}: {
	icon: any;
	value: string | number;
	unit: string;
	label: string;
	color: string;
	className?: string;
}) {
	return (
		<div className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-sm", className)}>
			<div className="flex items-center justify-center size-5 rounded-full bg-white/[0.03]" style={{ color }}>
				<Icon size={12} strokeWidth={3} />
			</div>
			<div className="flex flex-col">
				<div className="flex items-baseline gap-0.5">
					<span className="text-xs font-black text-white leading-none tabular-nums">{value}</span>
					<span className="text-[8px] font-black text-white/30 leading-none">{unit}</span>
				</div>
				<span className="text-[6px] font-black uppercase tracking-widest text-white/20 leading-none mt-0.5">{label}</span>
			</div>
		</div>
	);
}

const START_ANGLE = -130;
const END_ANGLE = 130;

/** A single premium radial gauge */
function PremiumGauge({
	value,
	max,
	label,
	unit,
	color,
	mini = false,
}: {
	value: number;
	max: number;
	label: string;
	unit: string;
	color: string;
	mini?: boolean;
}) {
	const size = mini ? 40 : 60;
	const stroke = mini ? 2.5 : 4;
	const radius = size / 2 - stroke / 2;
	const clampedAngle = clamping(value, START_ANGLE, END_ANGLE, max);
	const dot = polarToCartesian(size / 2, size / 2, radius, clampedAngle);

	// Track arc (static, full range)
	const bgArc = describeArc(size / 2, size / 2, radius, START_ANGLE, END_ANGLE);
	// Value arc (from start to clamped)
	const valArc = describeArc(size / 2, size / 2, radius, START_ANGLE, clampedAngle);

	return (
		<div className="flex flex-col items-center gap-0.5">
			<div className={clsx("relative flex items-center justify-center", mini ? "h-[40px] w-[40px]" : "h-[60px] w-[60px]")}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width={size}
					height={size}
					viewBox={`0 0 ${size} ${size}`}
					fill="none"
					className="absolute inset-0"
				>
					{/* Background arc */}
					<path
						d={bgArc}
						stroke="rgba(255,255,255,0.06)"
						strokeWidth={stroke}
						strokeLinecap="round"
						fill="none"
					/>
					{/* Filled arc */}
					<path
						d={bgArc} // Always full background arc
						stroke="rgba(255,255,255,0.02)"
						strokeWidth={stroke}
						fill="none"
					/>
					<path
						d={valArc}
						stroke={color}
						strokeWidth={stroke}
						strokeLinecap="round"
						fill="none"
						style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
					/>
					{/* Dot indicator */}
					<circle
						cx={dot.x}
						cy={dot.y}
						r={mini ? 2 : 3}
						fill={color}
						style={{ filter: `drop-shadow(0 0 3px ${color})` }}
					/>
				</svg>

				{/* Center value */}
				<div className={clsx("relative flex flex-col items-center z-10", mini ? "mt-1.5" : "mt-2")}>
					<span className={clsx("font-black tabular-nums text-white leading-none", mini ? "text-[10px]" : "text-[14px]")}>
						{value}
					</span>
					<span className={clsx("font-black text-white/30", mini ? "text-[6px] mt-0" : "text-[8px] mt-0.5")}>
						{unit}
					</span>
				</div>
			</div>

			{/* Label */}
			<span className={clsx("font-black tracking-[0.2em] uppercase", mini ? "text-[6px]" : "text-[7px]")} style={{ color }}>
				{label}
			</span>
		</div>
	);
}

/** Live compass showing wind direction and speed */
function WindGauge({ speed, directionDeg, mini = false }: { speed: number; directionDeg: number; mini?: boolean }) {
	const dir = getWindDirection(directionDeg);
	const size = mini ? 40 : 60;
	return (
		<div className="flex flex-col items-center gap-0.5">
			<div className={clsx("relative flex items-center justify-center", mini ? "h-[40px] w-[40px]" : "h-[60px] w-[60px]")}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width={size}
					height={size}
					viewBox={`0 0 ${size} ${size}`}
					fill="none"
					className="absolute inset-0"
				>
					{/* Compass ring */}
					<circle cx={size / 2} cy={size / 2} r={size / 2 - 3} stroke="rgba(255,255,255,0.06)" strokeWidth={mini ? 2 : 3} />
					{/* Cardinal ticks */}
					{[0, 90, 180, 270].map((a) => {
						const rad = ((a - 90) * Math.PI) / 180;
						const r1 = size / 2 - (mini ? 6 : 7);
						const r2 = size / 2 - 3;
						const x1 = size / 2 + r1 * Math.cos(rad);
						const y1 = size / 2 + r1 * Math.sin(rad);
						const x2 = size / 2 + r2 * Math.cos(rad);
						const y2 = size / 2 + r2 * Math.sin(rad);
						return (
							<line
								key={a}
								x1={x1}
								y1={y1}
								x2={x2}
								y2={y2}
								stroke="rgba(255,255,255,0.15)"
								strokeWidth={mini ? 1 : 1.5}
							/>
						);
					})}
					{/* Arrow rotated to wind direction */}
					<g transform={`rotate(${directionDeg}, ${size / 2}, ${size / 2})`}>
						<polygon
							points={mini ? "20,6 22,20 20,18 18,20" : "30,10 33,30 30,26 27,30"}
							fill="#60a5fa"
							style={{ filter: "drop-shadow(0 0 3px #60a5fa)" }}
						/>
					</g>
				</svg>

				{/* Center: speed */}
				<div className={clsx("relative flex flex-col items-center z-10", mini ? "mt-0.5" : "mt-1")}>
					<span className={clsx("font-black tabular-nums text-white leading-none", mini ? "text-[9px]" : "text-[13px]")}>
						{Math.round(speed)}
					</span>
					<span className={clsx("font-black text-white/30", mini ? "text-[5px]" : "text-[7px]")}>m/s</span>
				</div>
			</div>
			<span className={clsx("font-black tracking-[0.2em] text-sky-400 uppercase", mini ? "text-[6px]" : "text-[7px]")}>{dir} WIND</span>
		</div>
	);
}

/** Adaptive rain indicator */
function RainIndicator({ rain, mini = false }: { rain: boolean; mini?: boolean }) {
	return (
		<div className="flex flex-col items-center gap-0.5">
			<div
				className={clsx("relative flex items-center justify-center rounded-full transition-all", mini ? "h-[40px] w-[40px]" : "h-[60px] w-[60px]")}
				style={{
					background: rain ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.02)",
					border: rain
						? "1px solid rgba(59,130,246,0.4)"
						: "1px solid rgba(255,255,255,0.06)",
					boxShadow: rain ? "0 0 10px rgba(59,130,246,0.2)" : "none",
				}}
			>
				<svg width={mini ? "18" : "26"} height={mini ? "18" : "26"} viewBox="0 0 24 24" fill="none">
					<path
						d="M12 2C12 2 5 10 5 14a7 7 0 0014 0C19 10 12 2 12 2Z"
						fill={rain ? "#60a5fa" : "rgba(255,255,255,0.15)"}
						style={rain ? { filter: "drop-shadow(0 0 4px #60a5fa)" } : {}}
					/>
				</svg>
			</div>
			<span
				className={clsx("font-black tracking-[0.2em] uppercase", mini ? "text-[6px]" : "text-[7px]", rain ? "text-sky-400" : "text-zinc-600")}
			>
				{rain ? "RAIN" : "DRY"}
			</span>
		</div>
	);
}

export default function DataWeatherInfo({ mini = false }: { mini?: boolean }) {
	const weather = useDataStore((state) => state.state?.WeatherData);

	if (!weather) {
		return (
			<div className={clsx("flex items-center gap-4", !mini && "border-l border-white/5 pl-4")}>
				{[1, 2, 3, 4, 5].map((i) => (
					<div key={i} className={clsx("animate-pulse rounded-full bg-zinc-800/40", mini ? "h-8 w-20" : "h-[60px] w-[60px]")} />
				))}
			</div>
		);
	}

	if (mini) {
		return (
			<div className="flex items-center gap-2">
				<StatusPill
					icon={Thermometer}
					value={Math.round(parseFloat(weather.TrackTemp))}
					unit="°C"
					label="Track"
					color="#f97316"
				/>
				<StatusPill
					icon={Thermometer}
					value={Math.round(parseFloat(weather.AirTemp))}
					unit="°C"
					label="Air"
					color="#38bdf8"
				/>
				<div className="hidden 2xl:flex items-center gap-2">
					<StatusPill
						icon={Droplets}
						value={Math.round(parseFloat(weather.Humidity))}
						unit="%"
						label="Hum"
						color="#818cf8"
					/>
				</div>
				<StatusPill
					icon={Wind}
					value={Math.round(parseFloat(weather.WindSpeed))}
					unit="m/s"
					label={getWindDirection(parseInt(weather.WindDirection))}
					color="#60a5fa"
				/>
				<div className="hidden min-[1600px]:flex items-center gap-2">
					<StatusPill
						icon={CloudRain}
						value={weather.Rainfall === "1" ? "YES" : "NO"}
						unit=""
						label="Rain"
						color={weather.Rainfall === "1" ? "#60a5fa" : "#52525b"}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-5 border-l-0 sm:border-l border-white/10 pl-0 sm:pl-5">
			<PremiumGauge
				value={Math.round(parseFloat(weather.TrackTemp))}
				max={70}
				label="TRK"
				unit="°C"
				color="#f97316"
				mini={false}
			/>
			<PremiumGauge
				value={Math.round(parseFloat(weather.AirTemp))}
				max={45}
				label="AIR"
				unit="°C"
				color="#38bdf8"
				mini={false}
			/>
			<PremiumGauge
				value={Math.round(parseFloat(weather.Humidity))}
				max={100}
				label="HUM"
				unit="%"
				color="#818cf8"
				mini={false}
			/>
			<WindGauge
				speed={parseFloat(weather.WindSpeed)}
				directionDeg={parseInt(weather.WindDirection)}
				mini={false}
			/>
			<RainIndicator rain={weather.Rainfall === "1"} mini={false} />
		</div>
	);
}
