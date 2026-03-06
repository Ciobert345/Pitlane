"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import type { PositionCar, TimingDataDriver } from "@/types/state.type";
import type { Map, TrackPosition } from "@/types/map.type";

import { fetchMap } from "@/lib/fetchMap";

import { useDataStore } from "@/stores/useDataStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useFocusStore } from "@/stores/useFocusStore";
import { getTrackStatusMessage } from "@/lib/getTrackStatusMessage";
import {
	createSectors,
	findYellowSectors,
	getSectorColor,
	type MapSector,
	prioritizeColoredSectors,
	rad,
	rotate,
} from "@/lib/map";

const SPACE = 1000; // Reduced space to make the track much LARGER in the viewbox

function getDriverPosition(
	timingDriver: TimingDataDriver | undefined,
	originalTrackPoints: { x: number; y: number }[] | null,
): PositionCar | null {
	if (!timingDriver || !originalTrackPoints || originalTrackPoints.length === 0) {
		return null;
	}

	if (!timingDriver.Sectors || !Array.isArray(timingDriver.Sectors)) {
		return {
			Status: "OnTrack",
			X: originalTrackPoints[0].x,
			Y: originalTrackPoints[0].y,
			Z: 0,
		};
	}

	const allSegments = timingDriver.Sectors.flatMap((sector) => sector?.Segments || []);

	if (allSegments.length === 0) {
		return {
			Status: "OnTrack",
			X: originalTrackPoints[0].x,
			Y: originalTrackPoints[0].y,
			Z: 0,
		};
	}

	let furthestSegmentIndex = -1;
	for (let i = allSegments.length - 1; i >= 0; i--) {
		const segment = allSegments[i];
		if (segment && segment.Status !== undefined && segment.Status > 0) {
			furthestSegmentIndex = i;
			break;
		}
	}

	if (furthestSegmentIndex === -1) {
		for (let i = 0; i < allSegments.length; i++) {
			const segment = allSegments[i];
			if (segment && segment.Status !== undefined) {
				furthestSegmentIndex = i;
				break;
			}
		}
	}

	if (furthestSegmentIndex === -1) furthestSegmentIndex = 0;

	const baseRatio = furthestSegmentIndex / Math.max(allSegments.length - 1, 1);
	const currentSegmentStatus = allSegments[furthestSegmentIndex]?.Status || 0;

	const segmentProgress = currentSegmentStatus === 1 ? 0.5 : 0;
	const segmentSize = 1 / Math.max(allSegments.length, 1);
	const adjustedRatio = baseRatio + segmentProgress * segmentSize;

	const positionIndex = Math.floor(adjustedRatio * (originalTrackPoints.length - 1));
	const safeIndex = Math.min(Math.max(positionIndex, 0), originalTrackPoints.length - 1);

	const trackPoint = originalTrackPoints[safeIndex];

	return {
		Status: "OnTrack",
		X: trackPoint.x,
		Y: trackPoint.y,
		Z: 0,
	};
}

type Corner = {
	number: number;
	pos: TrackPosition;
	labelPos: TrackPosition;
};

type Props = {
	filter?: string[];
};

export default function Map({ filter }: Props) {
	const showCornerNumbers = useSettingsStore((state) => state.showCornerNumbers);
	const favoriteDrivers = useSettingsStore((state) => state.favoriteDrivers);
	const focusedDriver = useFocusStore((state) => state.focusedDriver);

	const positions = useDataStore((state) => state.positions);
	const carsData = useDataStore((state) => state.carsData);
	const drivers = useDataStore((state) => state?.state?.DriverList);
	const trackStatus = useDataStore((state) => state?.state?.TrackStatus);
	const timingDrivers = useDataStore((state) => state?.state?.TimingData);
	const raceControlMessages = useDataStore((state) => state?.state?.RaceControlMessages?.Messages ?? undefined);
	const circuitKey = useDataStore((state) => state?.state?.SessionInfo?.Meeting.Circuit.Key);

	const [[minX, minY, widthX, widthY], setBounds] = useState<(null | number)[]>([null, null, null, null]);
	const [[centerX, centerY], setCenter] = useState<(null | number)[]>([null, null]);

	const [points, setPoints] = useState<null | { x: number; y: number }[]>(null);
	const [sectors, setSectors] = useState<MapSector[]>([]);
	const [corners, setCorners] = useState<Corner[]>([]);
	const [rotation, setRotation] = useState<number>(0);
	const [finishLine, setFinishLine] = useState<null | { x: number; y: number; startAngle: number }>(null);
	const [originalTrackPoints, setOriginalTrackPoints] = useState<null | { x: number; y: number }[]>(null);
	const [timingSplits, setTimingSplits] = useState<{ x: number; y: number; label: string }[]>([]);

	// Generate map points
	useEffect(() => {
		(async () => {
			if (!circuitKey) return;
			const mapJson = await fetchMap(circuitKey);
			if (!mapJson) return;

			const MIRROR_X = -1;
			const mirroredX = mapJson.x.map((x) => x * MIRROR_X);
			const mirroredY = mapJson.y;

			const centerX = (Math.max(...mirroredX) + Math.min(...mirroredX)) / 2;
			const centerY = (Math.max(...mirroredY) + Math.min(...mirroredY)) / 2;

			const p1 = { x: mirroredX[0], y: mirroredY[0] };
			const p2 = { x: mirroredX[Math.min(20, mirroredX.length - 1)], y: mirroredY[Math.min(20, mirroredY.length - 1)] };
			const initialRotation = mapJson.rotation;

			const rp1 = rotate(p1.x, p1.y, initialRotation, centerX, centerY);
			const rp2 = rotate(p2.x, p2.y, initialRotation, centerX, centerY);
			const currentAngle = Math.atan2(rp2.y - rp1.y, rp2.x - rp1.x) * (180 / Math.PI);
			const tiltCorrection = 180 - currentAngle;
			const fixedRotation = initialRotation + tiltCorrection;

			const sectors = createSectors(mapJson).map((s) => ({
				...s,
				start: rotate(s.start.x * MIRROR_X, s.start.y, fixedRotation, centerX, centerY),
				end: rotate(s.end.x * MIRROR_X, s.end.y, fixedRotation, centerX, centerY),
				points: s.points.map((p) => rotate(p.x * MIRROR_X, p.y, fixedRotation, centerX, centerY)),
			}));

			const cornerPositions: Corner[] = mapJson.corners.map((corner) => ({
				number: corner.number,
				pos: rotate(corner.trackPosition.x * MIRROR_X, corner.trackPosition.y, fixedRotation, centerX, centerY),
				labelPos: rotate(
					(corner.trackPosition.x + 540 * Math.cos(rad(corner.angle))) * MIRROR_X,
					corner.trackPosition.y + 540 * Math.sin(rad(corner.angle)),
					fixedRotation,
					centerX,
					centerY,
				),
			}));

			const rotatedPoints = mirroredX.map((x, index) => rotate(x, mirroredY[index], fixedRotation, centerX, centerY));
			const pointsX = rotatedPoints.map((item) => item.x);
			const pointsY = rotatedPoints.map((item) => item.y);

			const cMinX = Math.min(...pointsX) - SPACE;
			const cMinY = Math.min(...pointsY) - SPACE;
			const cWidthX = Math.max(...pointsX) - cMinX + SPACE * 2;
			const cWidthY = Math.max(...pointsY) - cMinY + SPACE * 2;

			const rotatedFinishLine = rotate(mirroredX[0], mirroredY[0], fixedRotation, centerX, centerY);
			const dx = rotatedPoints[3].x - rotatedPoints[0].x;
			const dy = rotatedPoints[3].y - rotatedPoints[0].y;
			const startAngle = Math.atan2(dy, dx) * (180 / Math.PI);
			const originalPoints = mirroredX.map((x, index) => ({ x, y: mirroredY[index] }));

			setCenter([centerX, centerY]);
			setBounds([cMinX, cMinY, cWidthX, cWidthY]);
			setSectors(sectors);
			setPoints(rotatedPoints);
			setRotation(fixedRotation);
			setCorners(cornerPositions);
			setFinishLine({ x: rotatedFinishLine.x, y: rotatedFinishLine.y, startAngle });
			setOriginalTrackPoints(originalPoints);
		})();
	}, [circuitKey]);

	// Pre-calculate the exact indices for S1, S2, S3 boundaries
	const { s1Index, s2Index } = useMemo(() => {
		if (!points || !timingDrivers) return { s1Index: undefined, s2Index: undefined };
		let s1Index, s2Index;
		let referenceDriver = null;

		for (const driver of Object.values(timingDrivers.Lines)) {
			if (
				driver &&
				driver.Sectors &&
				Array.isArray(driver.Sectors) &&
				driver.Sectors.length >= 3 &&
				driver.Sectors[0]?.Segments?.length > 0 &&
				driver.Sectors[1]?.Segments?.length > 0
			) {
				referenceDriver = driver;
				break;
			}
		}

		if (referenceDriver) {
			const s1Segments = referenceDriver.Sectors[0].Segments.length;
			const s2Segments = referenceDriver.Sectors[1].Segments.length;
			const totalSegments = referenceDriver.Sectors.reduce((acc, s) => acc + (s?.Segments?.length || 0), 0);
			if (totalSegments > 0) {
				s1Index = Math.floor((s1Segments / totalSegments) * (points.length - 1));
				s2Index = Math.floor(((s1Segments + s2Segments) / totalSegments) * (points.length - 1));
			}
		}

		if (s1Index === undefined || s2Index === undefined) {
			s1Index = Math.floor(points.length * 0.33);
			s2Index = Math.floor(points.length * 0.66);
		}

		return { s1Index, s2Index };
	}, [timingDrivers, points]);

	// Calculate S1/S2 timing splits positions
	useEffect(() => {
		if (!points || s1Index === undefined || s2Index === undefined) return;

		const rs1 = points[Math.min(s1Index, points.length - 1)];
		const rs2 = points[Math.min(s2Index, points.length - 1)];

		setTimingSplits([
			{ ...rs1, label: "S1" },
			{ ...rs2, label: "S2" },
		]);
	}, [points, s1Index, s2Index]);

	// Marshal Sectors (Yellow Flags)
	const yellowSectors = useMemo(() => findYellowSectors(raceControlMessages), [raceControlMessages]);
	const renderedSectors = useMemo(() => {
		const status = getTrackStatusMessage(trackStatus?.Status ? parseInt(trackStatus.Status) : undefined);
		return sectors
			.map((sector) => {
				const colorClass = getSectorColor(sector, status?.bySector, status?.trackColor, yellowSectors);
				let strokeHex = "transparent";
				if (colorClass.includes("yellow")) strokeHex = "#facc15";
				if (colorClass.includes("red")) strokeHex = "#ef4444";
				if (colorClass.includes("green")) strokeHex = "#22c55e";

				return {
					colorClass,
					strokeHex,
					pulse: status?.pulse,
					number: sector.number,
					strokeWidth: 100,
					d: `M${sector.points[0].x},${sector.points[0].y} ${sector.points.map((point) => `L${point.x},${point.y}`).join(" ")}`,
				};
			})
			.sort(prioritizeColoredSectors);
	}, [trackStatus, sectors, yellowSectors]);

	// MAIN MAP SECTORS - Base colors and Dynamic Halo
	const mapSectors = useMemo(() => {
		if (!points || s1Index === undefined || s2Index === undefined) return [];

		// Create paths that overlap correctly at the joints
		const s1Pts = points.slice(0, s1Index + 1);
		const s2Pts = points.slice(s1Index, s2Index + 1);
		const s3Pts = points.slice(s2Index).concat([points[0]]);

		// Base track colors (Three elegant distinct grays for unselected state)
		const s1Base = "#27272a"; // Zinc 800 - Standard Dark Tarmac
		const s2Base = "#3f3f46"; // Zinc 700 - Lighter Tarmac
		const s3Base = "#475569"; // Slate 600 - Noticeably blue-tinted gray (highly distinct)

		// Performance Halo colors (default transparent)
		let s1Halo = "transparent";
		let s2Halo = "transparent";
		let s3Halo = "transparent";

		const activeDriverNumber = focusedDriver || (filter && filter.length === 1 ? filter[0] : null);

		if (activeDriverNumber && timingDrivers) {
			const timingDriver = timingDrivers.Lines[activeDriverNumber];

			if (timingDriver && timingDriver.Sectors && Array.isArray(timingDriver.Sectors)) {
				const getHaloColor = (sector: any) => {
					if (!sector) return "transparent";
					if (sector.OverallFastest) return "#a855f7"; // Purple solid
					if (sector.PersonalFastest) return "#34d399"; // Green solid
					const hasSegments = Array.isArray(sector.Segments) && sector.Segments.some((s: any) => s.Status > 0);
					if (sector.Value || hasSegments) return "#facc15"; // Yellow solid
					return "transparent";
				};

				s1Halo = getHaloColor(timingDriver.Sectors[0]);
				s2Halo = getHaloColor(timingDriver.Sectors[1]);
				s3Halo = getHaloColor(timingDriver.Sectors[2]);
			}
		}

		return [
			{ d: `M${s1Pts.map(p => `${p.x},${p.y}`).join(" L")}`, label: "S1", base: s1Base, halo: s1Halo },
			{ d: `M${s2Pts.map(p => `${p.x},${p.y}`).join(" L")}`, label: "S2", base: s2Base, halo: s2Halo },
			{ d: `M${s3Pts.map(p => `${p.x},${p.y}`).join(" L")}`, label: "S3", base: s3Base, halo: s3Halo },
		];
	}, [points, s1Index, s2Index, filter, favoriteDrivers, timingDrivers, focusedDriver]);


	if (!points || !minX || !minY || !widthX || !widthY) {
		return (
			<div className="h-full w-full p-2" style={{ minHeight: "20rem" }}>
				<div className="h-full w-full animate-pulse rounded-lg bg-zinc-800" />
			</div>
		);
	}

	return (
		<svg
			viewBox={`${minX} ${minY} ${widthX} ${widthY}`}
			className="h-full w-full"
			preserveAspectRatio="xMidYMid meet"
			xmlns="http://www.w3.org/2000/svg"
			style={{ overflow: "visible" }}
		>
			<style>
				{`
					@keyframes dashScroll {
						to { stroke-dashoffset: -120; }
					}
				`}
			</style>

			{/* Full Black Outer Border (Kerb Outline for physical depth) */}
			<path
				d={`M${points.map(p => `${p.x},${p.y}`).join(" L")}`}
				fill="none"
				stroke="#000000"
				strokeWidth={280}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			{/* Multi-Tone Base Track */}
			{mapSectors.map((sector) => (
				<path
					key={`base.${sector.label}`}
					d={sector.d}
					fill="none"
					stroke={sector.base}
					strokeWidth={220}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			))}

			{/* Inner Track Dash Texture (Racing Line - Animated) */}
			<path
				d={`M${points.map(p => `${p.x},${p.y}`).join(" L")}`}
				fill="none"
				stroke="rgba(255,255,255,0.06)"
				strokeWidth={6}
				strokeDasharray="60 60"
				strokeLinecap="round"
				strokeLinejoin="round"
				style={{ animation: "dashScroll 1.5s linear infinite" }}
			/>

			{/* Halo Glow (Wide, subtle translucent bloom) */}
			{mapSectors.map((sector) => (
				<path
					key={`haloGlow.${sector.label}`}
					className="transition-all duration-300"
					d={sector.d}
					fill="none"
					stroke={sector.halo}
					strokeWidth={180} // Wide track coverage
					strokeLinecap="round"
					strokeLinejoin="round"
					style={{ opacity: sector.halo !== "transparent" ? 0.3 : 0 }}
				/>
			))}

			{/* Halo Core (Sharp laser line) */}
			{mapSectors.map((sector) => (
				<path
					key={`haloCore.${sector.label}`}
					className="transition-all duration-300"
					d={sector.d}
					fill="none"
					stroke={sector.halo}
					strokeWidth={60} // Sharp focused core
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			))}

			{/* Data Nodes (S1 & S2 Intersections) */}
			{timingSplits.map((split) => (
				<g key={`dataNode.${split.label}`} transform={`translate(${split.x}, ${split.y})`}>
					<circle r={140} fill="#18181b" stroke="#a1a1aa" strokeWidth={24} />
					<circle r={50} fill="#ffffff" />
					<rect x={-200} y={-350} width={400} height={200} fill="#18181b" stroke="#ffffff" strokeWidth={10} rx={40} />
					<text y={-240} textAnchor="middle" fill="#ffffff" fontSize={140} className="font-mono font-black">{split.label}</text>
				</g>
			))}

			{/* Marshal Status (Yellow Flags) */}
			{renderedSectors.filter(s => s.colorClass !== "stroke-white").map((sector) => {
				const style = sector.pulse ? { animation: `${sector.pulse * 100}ms linear infinite pulse` } : {};
				return (
					<path
						key={`map.rc.${sector.number}`}
						stroke={sector.strokeHex}
						strokeWidth={140}
						strokeLinecap="round"
						strokeLinejoin="round"
						fill="transparent"
						d={sector.d}
						style={style}
					/>
				);
			})}

			{/* Callouts: Pro Minimalist */}
			{finishLine && (
				<g>
					{/* Red Timing Beam */}
					<line
						x1={finishLine.x - 1200} y1={finishLine.y}
						x2={finishLine.x + 1200} y2={finishLine.y}
						stroke="#ef4444" strokeWidth={40} opacity="1"
						transform={`rotate(${finishLine.startAngle + 90}, ${finishLine.x}, ${finishLine.y})`}
					/>
					<g transform={`translate(${finishLine.x}, ${finishLine.y - 1000})`}>
						<rect x={-700} y={-160} width={1400} height={320} fill="#000000" stroke="#ffffff" strokeWidth={16} rx={40} />
						<text textAnchor="middle" dominantBaseline="middle" fill="#ffffff" className="font-mono font-black" fontSize={180} y={20}>
							START/FINISH
						</text>
					</g>
				</g>
			)}

			{showCornerNumbers && corners.map((corner) => (
				<CornerNumber key={`corner.${corner.number}`} number={corner.number} x={corner.labelPos.x} y={corner.labelPos.y} />
			))}

			{centerX && centerY && drivers && timingDrivers && (
				<>
					{Object.values(drivers)
						.reverse()
						.filter((driver) => (filter ? filter.includes(driver.RacingNumber) : true))
						.map((driver) => {
							const timingDriver = timingDrivers?.Lines[driver.RacingNumber];
							const hidden = timingDriver ? timingDriver.KnockedOut || timingDriver.Stopped || timingDriver.Retired : false;
							const pit = timingDriver ? timingDriver.InPit : false;
							const targetPosition = positions?.[driver.RacingNumber] || getDriverPosition(timingDriver, originalTrackPoints);
							if (!targetPosition) return null;
							const carData = carsData?.[driver.RacingNumber]?.Channels;
							return (
								<CarDot
									key={`map.driver.${driver.RacingNumber}`}
									favoriteDriver={favoriteDrivers.length > 0 ? favoriteDrivers.includes(driver.RacingNumber) : false}
									name={driver.Tla}
									color={driver.TeamColour}
									pit={pit}
									hidden={hidden}
									pos={targetPosition}
									speed={carData?.["2"]}
									brake={carData?.["5"] === 1}
									throttle={(carData?.["4"] ?? 0) > 0}
									rotation={rotation}
									centerX={centerX}
									centerY={centerY}
								/>
							);
						})}
				</>
			)}
		</svg>
	);
}

const CornerNumber = ({ number, x, y }: { number: number; x: number; y: number }) => {
	return (
		<g transform={`translate(${x}, ${y})`}>
			<rect x={-150} y={-150} width={300} height={300} fill="#18181b" stroke="#ffffff" strokeWidth={12} rx={40} />
			<text textAnchor="middle" dominantBaseline="middle" fill="#a1a1aa" className="font-mono font-black" fontSize={220} y={25}>
				{number}
			</text>
		</g>
	);
};

type CarDotProps = {
	name: string;
	color: string | undefined;
	favoriteDriver: boolean;
	pit: boolean;
	hidden: boolean;
	pos: PositionCar;
	speed?: number;
	brake?: boolean;
	throttle?: boolean;
	rotation: number;
	centerX: number;
	centerY: number;
};

const CarDot = ({
	pos,
	name,
	color,
	favoriteDriver,
	pit,
	hidden,
	speed,
	brake,
	throttle,
	rotation,
	centerX,
	centerY,
}: CarDotProps) => {
	const rotatedPos = rotate(pos.X, pos.Y, rotation, centerX, centerY);
	const transformStr = `translate(${rotatedPos.x}px, ${rotatedPos.y}px) scale(${pit ? 0.6 : 1})`;

	return (
		<g
			className={clsx("transition-all duration-300", { "opacity-60": pit }, { "opacity-0 invisible": hidden })}
			style={{
				transform: transformStr,
				transition: "transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 300ms",
				willChange: "transform",
			}}
		>
			<circle r={350} fill="#000000" />
			<circle r={310} fill="#000000" stroke={color ? `#${color}` : "#ffffff"} strokeWidth={80} />
			<circle r={210} fill={color ? `#${color}` : "#ffffff"} />

			<g transform="translate(400, -200)">
				<rect x={0} y={-150} width={800} height={300} fill="#000000" stroke={color ? `#${color}` : "#ffffff"} strokeWidth={16} rx={40} />
				<text fontWeight="900" fontSize={200} fill="#ffffff" x={80} y={65} className="font-mono">{name}</text>
				{speed !== undefined && <text fontSize={140} fill="#d4d4d8" x={450} y={65} className="font-mono">{speed}</text>}
			</g>
		</g>
	);
};
