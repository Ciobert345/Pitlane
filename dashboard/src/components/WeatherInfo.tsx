"use client";

import { clamping, describeArc, polarToCartesian } from "@/lib/circle";
import { getWindDirection } from "@/lib/getWindDirection";
import { useDataStore } from "@/stores/useDataStore";

const SIZE = 60;
const STROKE = 4;
const RADIUS = SIZE / 2 - STROKE / 2;
const START_ANGLE = -130;
const END_ANGLE = 130;

/** A single premium radial gauge */
function PremiumGauge({
	value,
	max,
	label,
	unit,
	color,
}: {
	value: number;
	max: number;
	label: string;
	unit: string;
	color: string;
}) {
	const clampedAngle = clamping(value, START_ANGLE, END_ANGLE, max);
	const dot = polarToCartesian(SIZE / 2, SIZE / 2, RADIUS, clampedAngle);

	// Track arc (static, full range)
	const bgArc = describeArc(SIZE / 2, SIZE / 2, RADIUS, START_ANGLE, END_ANGLE);
	// Value arc (from start to clamped)
	const valArc = describeArc(SIZE / 2, SIZE / 2, RADIUS, START_ANGLE, clampedAngle);

	return (
		<div className="flex flex-col items-center gap-0.5">
			<div className="relative flex h-[60px] w-[60px] items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width={SIZE}
					height={SIZE}
					viewBox={`0 0 ${SIZE} ${SIZE}`}
					fill="none"
					className="absolute inset-0"
				>
					{/* Background arc */}
					<path
						d={bgArc}
						stroke="rgba(255,255,255,0.06)"
						strokeWidth={STROKE}
						strokeLinecap="round"
						fill="none"
					/>
					{/* Filled arc */}
					<path
						d={valArc}
						stroke={color}
						strokeWidth={STROKE}
						strokeLinecap="round"
						fill="none"
						style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
					/>
					{/* Dot indicator */}
					<circle
						cx={dot.x}
						cy={dot.y}
						r={3}
						fill={color}
						style={{ filter: `drop-shadow(0 0 3px ${color})` }}
					/>
				</svg>

				{/* Center value */}
				<div className="relative flex flex-col items-center mt-2 z-10">
					<span className="text-[14px] font-black tabular-nums text-white leading-none">{value}</span>
					<span className="text-[8px] font-black text-white/30 mt-0.5">{unit}</span>
				</div>
			</div>

			{/* Label */}
			<span className="text-[7px] font-black tracking-[0.2em] uppercase" style={{ color }}>
				{label}
			</span>
		</div>
	);
}

/** Live compass showing wind direction and speed */
function WindGauge({ speed, directionDeg }: { speed: number; directionDeg: number }) {
	const dir = getWindDirection(directionDeg);
	return (
		<div className="flex flex-col items-center gap-0.5">
			<div className="relative flex h-[60px] w-[60px] items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width={SIZE}
					height={SIZE}
					viewBox={`0 0 ${SIZE} ${SIZE}`}
					fill="none"
					className="absolute inset-0"
				>
					{/* Compass ring */}
					<circle cx="30" cy="30" r="27" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
					{/* Cardinal ticks */}
					{[0, 90, 180, 270].map((a) => {
						const rad = ((a - 90) * Math.PI) / 180;
						const x1 = 30 + 23 * Math.cos(rad);
						const y1 = 30 + 23 * Math.sin(rad);
						const x2 = 30 + 27 * Math.cos(rad);
						const y2 = 30 + 27 * Math.sin(rad);
						return (
							<line
								key={a}
								x1={x1}
								y1={y1}
								x2={x2}
								y2={y2}
								stroke="rgba(255,255,255,0.15)"
								strokeWidth="1.5"
							/>
						);
					})}
					{/* Arrow rotated to wind direction */}
					<g transform={`rotate(${directionDeg}, 30, 30)`}>
						<polygon
							points="30,10 33,30 30,26 27,30"
							fill="#60a5fa"
							style={{ filter: "drop-shadow(0 0 3px #60a5fa)" }}
						/>
					</g>
				</svg>

				{/* Center: speed */}
				<div className="relative flex flex-col items-center mt-1 z-10">
					<span className="text-[13px] font-black tabular-nums text-white leading-none">
						{Math.round(speed)}
					</span>
					<span className="text-[7px] font-black text-white/30">m/s</span>
				</div>
			</div>
			<span className="text-[7px] font-black tracking-[0.2em] text-sky-400 uppercase">{dir} WIND</span>
		</div>
	);
}

/** Adaptive rain indicator */
function RainIndicator({ rain }: { rain: boolean }) {
	return (
		<div className="flex flex-col items-center gap-0.5">
			<div
				className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full"
				style={{
					background: rain ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.02)",
					border: rain
						? "1px solid rgba(59,130,246,0.4)"
						: "1px solid rgba(255,255,255,0.06)",
					boxShadow: rain ? "0 0 10px rgba(59,130,246,0.2)" : "none",
				}}
			>
				<svg width="26" height="26" viewBox="0 0 24 24" fill="none">
					<path
						d="M12 2C12 2 5 10 5 14a7 7 0 0014 0C19 10 12 2 12 2Z"
						fill={rain ? "#60a5fa" : "rgba(255,255,255,0.15)"}
						style={rain ? { filter: "drop-shadow(0 0 4px #60a5fa)" } : {}}
					/>
				</svg>
			</div>
			<span
				className={`text-[7px] font-black tracking-[0.2em] uppercase ${rain ? "text-sky-400" : "text-zinc-600"}`}
			>
				{rain ? "RAIN" : "DRY"}
			</span>
		</div>
	);
}

export default function DataWeatherInfo() {
	const weather = useDataStore((state) => state.state?.WeatherData);

	if (!weather) {
		return (
			<div className="flex items-center gap-4 border-l border-white/5 pl-4">
				{[1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="h-[60px] w-[60px] animate-pulse rounded-full bg-zinc-800/40" />
				))}
			</div>
		);
	}

	return (
		<div className="flex items-center gap-5 border-l border-white/10 pl-5">
			<PremiumGauge
				value={Math.round(parseFloat(weather.TrackTemp))}
				max={70}
				label="TRK"
				unit="°C"
				color="#f97316"
			/>
			<PremiumGauge
				value={Math.round(parseFloat(weather.AirTemp))}
				max={45}
				label="AIR"
				unit="°C"
				color="#38bdf8"
			/>
			<PremiumGauge
				value={Math.round(parseFloat(weather.Humidity))}
				max={100}
				label="HUM"
				unit="%"
				color="#818cf8"
			/>
			<WindGauge
				speed={parseFloat(weather.WindSpeed)}
				directionDeg={parseInt(weather.WindDirection)}
			/>
			<RainIndicator rain={weather.Rainfall === "1"} />
		</div>
	);
}
