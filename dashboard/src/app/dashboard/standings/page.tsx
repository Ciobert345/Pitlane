"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import clsx from "clsx";
import { useDataStore } from "@/stores/useDataStore";
import NumberDiff from "@/components/NumberDiff";
import Image from "next/image";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		// Sort payload by value descending to list the current top drivers in the round
		const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

		return (
			<div className="rounded-xl border border-white/10 bg-zinc-950/80 p-3 shadow-2xl backdrop-blur-xl min-w-[170px]">
				<p className="mb-2 border-b border-white/10 pb-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
				<div className="flex flex-col gap-1.5">
					{sortedPayload.map((entry: any, index: number) => (
						<div key={index} className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<div
									className="h-1.5 w-1.5 rounded-full shadow-sm"
									style={{ backgroundColor: entry.stroke, boxShadow: `0 0 6px ${entry.stroke}` }}
								/>
								<span className="text-[11px] font-bold text-white uppercase tracking-wider">{entry.name}</span>
							</div>
							<span className="text-xs font-black tabular-nums text-white/90">{entry.value}</span>
						</div>
					))}
				</div>
			</div>
		);
	}
	return null;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-4 px-1 mb-4">
			<h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 whitespace-nowrap">{children}</h3>
			<div className="h-px flex-1 bg-white/5" />
		</div>
	);
}

const SkeletonRow = () => (
	<div className="flex items-center gap-4 rounded-3xl border border-white/5 bg-zinc-950/40 backdrop-blur-md p-5 shadow-lg">
		<div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />
		<div className="flex-1 flex flex-col gap-2">
			<div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
			<div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
		</div>
		<div className="h-8 w-16 animate-pulse rounded bg-zinc-800" />
	</div>
);

// We define reliable F1 team colors for the charts
const teamColorsMap: Record<string, string> = {
	"red_bull": "#3671C6",
	"red-bull-racing": "#3671C6",
	"ferrari": "#E8002D",
	"mercedes": "#27F4D2",
	"mclaren": "#FF8000",
	"aston_martin": "#229971",
	"aston-martin": "#229971",
	"alpine": "#0093cc",
	"williams": "#64C4FF",
	"haas": "#B6BABD",
	"haas-f1-team": "#B6BABD",
	"sauber": "#52E252",
	"kick-sauber": "#52E252",
	"rb": "#6692FF",
	"racing-bulls": "#6692FF",
	// Legacy
	"alphatauri": "#5E8FAA",
	"renault": "#FFF500",
	"racing_point": "#F596C8",
	"toro_rosso": "#0000FF",
	"force_india": "#FF8080",
	"lotus_f1": "#FFB800",
	"williams_toyota": "#0000FF",
};

function getTeamColor(teamId: string, teamName: string, fallback: string = "#444") {
	const id = teamId?.toLowerCase() || teamName.toLowerCase().replace(/[^a-z0-9]/g, "-");
	return teamColorsMap[id] || fallback;
}

function getTeamLogo(constructorName: string, constructorId?: string): string | null {
	const id = constructorId?.toLowerCase() || constructorName.toLowerCase().replace(/[^a-z0-9]/g, "-");

	switch (id) {
		case "red-bull-racing":
		case "red_bull": return "red-bull-racing.svg";
		case "ferrari": return "ferrari.svg";
		case "mercedes": return "mercedes.svg";
		case "mclaren": return "mclaren.svg";
		case "aston-martin":
		case "aston_martin": return "aston-martin.svg";
		case "alpine": return "alpine.svg";
		case "williams": return "williams.svg";
		case "haas-f1-team":
		case "haas": return "haas-f1-team.svg";
		case "kick-sauber":
		case "sauber": return "kick-sauber.svg";
		case "racing-bulls":
		case "rb": return "racing-bulls.svg";
		default: return null;
	}
}

function getRankStyle(position: number | string) {
	const pos = Number(position);
	if (pos === 1) return "from-amber-400/20 to-transparent border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.15)]";
	if (pos === 2) return "from-slate-300/20 to-transparent border-slate-300/50 shadow-[0_0_30px_rgba(203,213,225,0.1)]";
	if (pos === 3) return "from-orange-700/20 to-transparent border-orange-700/50 shadow-[0_0_30px_rgba(194,65,12,0.15)]";
	return "from-white/[0.05] to-transparent border-white/10 hover:bg-white/[0.08]";
}

function getRankTextColor(position: number | string) {
	const pos = Number(position);
	if (pos === 1) return "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]";
	if (pos === 2) return "text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.8)]";
	if (pos === 3) return "text-orange-600 drop-shadow-[0_0_8px_rgba(194,65,12,0.8)]";
	return "text-white";
}

type JolpiDriverStanding = {
	position: string;
	points: string;
	Driver: { givenName: string; familyName: string; permanentNumber?: string; driverId: string; code?: string };
	Constructors: { constructorId: string; name: string }[];
};

type JolpiConstructorStanding = {
	position: string;
	points: string;
	Constructor: { constructorId: string; name: string };
};

type HistoricalRaceResult = {
	round: string;
	raceName: string;
	Results: {
		position: string;
		points: string;
		Driver: { driverId: string; code: string; familyName: string };
		Constructor: { constructorId: string };
	}[];
};

export default function Standings() {
	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState<number>(currentYear);
	const [category, setCategory] = useState<"drivers" | "constructors">("drivers");
	const [loading, setLoading] = useState(false);
	const [apiDriverData, setApiDriverData] = useState<JolpiDriverStanding[]>([]);
	const [apiTeamData, setApiTeamData] = useState<JolpiConstructorStanding[]>([]);
	const [apiRaceResults, setApiRaceResults] = useState<HistoricalRaceResult[]>([]);
	const [driverHeadshots, setDriverHeadshots] = useState<Record<string, string>>({});

	// Compass Scroll State
	const scrollRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [startX, setStartX] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);

	// Live State (only relevant for current year during a live session)
	const liveDriverPrediction = useDataStore((state) => state.state?.ChampionshipPrediction?.Drivers);
	const liveTeamPrediction = useDataStore((state) => state.state?.ChampionshipPrediction?.Teams);
	const liveDrivers = useDataStore((state) => state.state?.DriverList);
	const isLiveSession = useDataStore((state) => state.state?.SessionInfo?.Type === "Race");

	const useLiveDrivers = selectedYear === currentYear && isLiveSession && liveDriverPrediction && liveDrivers;
	const useLiveTeams = selectedYear === currentYear && isLiveSession && liveTeamPrediction;

	useEffect(() => {
		let isMounted = true;
		// If we can use live data for the current year, don't fetch from API
		if (selectedYear === currentYear && isLiveSession) return;

		const fetchData = async () => {
			setLoading(true);
			try {
				if (category === "drivers") {
					const res = await fetch(`https://api.jolpi.ca/ergast/f1/${selectedYear}/driverStandings.json`);
					const data = await res.json();
					if (isMounted) {
						setApiDriverData(data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || []);
					}

					// Fetch race results for charts bypassing the 100 limit limit
					const offsets = [0, 100, 200, 300, 400];
					const resultsPromises = offsets.map(offset =>
						fetch(`https://api.jolpi.ca/ergast/f1/${selectedYear}/results.json?limit=100&offset=${offset}`)
							.then(res => res.json())
							.catch(() => null)
					);
					const resultsResponses = await Promise.all(resultsPromises);

					if (isMounted) {
						let allRaces: HistoricalRaceResult[] = [];
						resultsResponses.forEach(resData => {
							if (resData?.MRData?.RaceTable?.Races) {
								allRaces = [...allRaces, ...resData.MRData.RaceTable.Races];
							}
						});
						// Group by round to merge results from different pages if separated
						const racesByRound: Record<string, HistoricalRaceResult> = {};
						allRaces.forEach(race => {
							if (!racesByRound[race.round]) {
								racesByRound[race.round] = { ...race, Results: [] };
							}
							racesByRound[race.round].Results.push(...race.Results);
						});
						setApiRaceResults(Object.values(racesByRound));
					}

				} else {
					const res = await fetch(`https://api.jolpi.ca/ergast/f1/${selectedYear}/constructorStandings.json`);
					const data = await res.json();
					if (isMounted) {
						setApiTeamData(data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || []);
					}
				}
			} catch (error) {
				console.error("Failed to fetch standings:", error);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchData();
		return () => { isMounted = false; };
	}, [selectedYear, category, currentYear, isLiveSession]);

	// Fetch OpenF1 Drivers for Photo Mapping only once
	useEffect(() => {
		const fetchPhotos = async () => {
			try {
				const res = await fetch("https://api.openf1.org/v1/drivers");
				const data = await res.json();
				const map: Record<string, string> = {};
				// We prioritize latest ones by iterating forward (in case of duplicates)
				data.forEach((d: any) => {
					if (d.name_acronym && d.headshot_url) {
						map[d.name_acronym] = d.headshot_url;
					}
				});
				setDriverHeadshots(map);
			} catch (e) { /* ignore */ }
		};
		fetchPhotos();
	}, []);

	const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

	// Transform historical race results into a cumulative point chart format
	const chartData = useMemo(() => {
		if (category !== "drivers" || !apiRaceResults.length || !apiDriverData.length || useLiveDrivers) return [];

		// Get the top 10 drivers
		const top10Drivers = apiDriverData.slice(0, 10).map(d => d.Driver.driverId);

		const progression: Record<string, number> = {};
		top10Drivers.forEach(pid => progression[pid] = 0);

		return apiRaceResults.map((race) => {
			const roundData: any = { name: `Round ${race.round}` };

			race.Results?.forEach(result => {
				const id = result.Driver.driverId;
				if (top10Drivers.includes(id)) {
					progression[id] += Number(result.points);
				}
			});

			top10Drivers.forEach(pid => {
				roundData[pid] = progression[pid];
			});

			return roundData;
		});
	}, [apiRaceResults, apiDriverData, category, useLiveDrivers]);

	// Transform historical race results into a cumulative point chart format for constructors
	const constructorChartData = useMemo(() => {
		if (category !== "constructors" || !apiRaceResults.length || !apiTeamData.length || useLiveTeams) return [];

		// Get the top 10 constructors
		const top10Constructors = apiTeamData.slice(0, 10).map(c => c.Constructor.constructorId);

		const progression: Record<string, number> = {};
		top10Constructors.forEach(cid => progression[cid] = 0);

		return apiRaceResults.map((race) => {
			const roundData: any = { name: `Round ${race.round}` };

			race.Results?.forEach(result => {
				const id = result.Constructor?.constructorId;
				if (id && top10Constructors.includes(id)) {
					progression[id] += Number(result.points);
				}
			});

			top10Constructors.forEach(cid => {
				roundData[cid] = progression[cid];
			});

			return roundData;
		});
	}, [apiRaceResults, apiTeamData, category, useLiveTeams]);

	const hasChart = (category === "drivers" && chartData.length > 0) || (category === "constructors" && constructorChartData.length > 0);

	// Compass Drag & Scroll Handlers
	const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
		if (!scrollRef.current) return;
		setIsDragging(true);
		setStartX(e.pageX - scrollRef.current.offsetLeft);
		setScrollLeft(scrollRef.current.scrollLeft);
	};

	const handleMouseLeave = () => {
		setIsDragging(false);
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
		if (!isDragging || !scrollRef.current) return;
		e.preventDefault();
		const x = e.pageX - scrollRef.current.offsetLeft;
		const walk = (x - startX) * 2; // Scroll speed multiplier
		scrollRef.current.scrollLeft = scrollLeft - walk;
	};

	const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		if (!scrollRef.current) return;
		scrollRef.current.scrollLeft += e.deltaY;
	};

	return (
		<div className="flex h-full flex-col p-6">
			{/* Controls Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<h1 className="text-xl font-bold uppercase tracking-wider text-white">Standings</h1>
					{useLiveDrivers || useLiveTeams ? (
						<span className="rounded-full bg-f1-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-f1-accent">
							Live Prediction
						</span>
					) : (
						<span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
							Official Data
						</span>
					)}
				</div>

				<div className="flex w-full overflow-hidden flex-col gap-4 sm:flex-row sm:items-center">
					{/* Horizontal Year Compass */}
					<div
						className="flex-1 overflow-x-auto no-scrollbar relative w-full sm:max-w-md xl:max-w-2xl cursor-grab active:cursor-grabbing"
						ref={scrollRef}
						onMouseDown={handleMouseDown}
						onMouseLeave={handleMouseLeave}
						onMouseUp={handleMouseUp}
						onMouseMove={handleMouseMove}
						onWheel={handleWheel}
						style={{
							maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
							WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)"
						}}
					>
						<div className="flex items-center gap-3 py-2 px-6 w-max">
							{years.map((year) => {
								const isSelected = selectedYear === year;
								return (
									<button
										key={year}
										onClick={() => setSelectedYear(year)}
										className={clsx(
											"shrink-0 rounded-full px-5 py-2 text-sm font-black transition-all border",
											isSelected
												? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] border-transparent scale-105"
												: "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white border-white/5 scale-95 hover:scale-100"
										)}
									>
										{year}
									</button>
								);
							})}
						</div>
					</div>

					<div className="flex rounded-lg border border-white/10 bg-white/5 p-1 glass">
						<button
							onClick={() => setCategory("drivers")}
							className={clsx(
								"rounded-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
								category === "drivers" ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-white"
							)}
						>
							Drivers
						</button>
						<button
							onClick={() => setCategory("constructors")}
							className={clsx(
								"rounded-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
								category === "constructors" ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-white"
							)}
						>
							Constructors
						</button>
					</div>
				</div>
			</div>

			{/* Content Container: Dynamic Layout based on category */}
			<div className={clsx(
				"flex-1 overflow-hidden flex flex-col gap-6",
				hasChart ? "xl:flex-row" : ""
			)}>

				{/* Chart Section (Left/Top if active) */}
				{!loading && hasChart && (
					<div className="w-full xl:w-1/2 2xl:w-[55%] h-[350px] xl:h-full rounded-3xl border border-white/5 bg-zinc-950/40 backdrop-blur-md p-6 glass shadow-xl flex flex-col xl:sticky xl:top-0">
						<SectionLabel>Top 10 Points Progression</SectionLabel>
						<ResponsiveContainer width="100%" height="95%">
							<LineChart data={category === "drivers" ? chartData : constructorChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
								<XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickMargin={10} minTickGap={15} />
								<YAxis stroke="#ffffff40" fontSize={10} tickMargin={10} />
								<Tooltip
									content={<CustomTooltip />}
									cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: '4 4' }}
								/>
								{category === "drivers" && apiDriverData.slice(0, 10).map((driver) => (
									<Line
										key={driver.Driver.driverId}
										type="monotone"
										dataKey={driver.Driver.driverId}
										name={driver.Driver.familyName}
										stroke={getTeamColor(driver.Constructors[0]?.constructorId, driver.Constructors[0]?.name)}
										strokeWidth={3}
										dot={false}
										activeDot={{ r: 5, strokeWidth: 2, fill: '#09090b' }}
									/>
								))}
								{category === "constructors" && apiTeamData.slice(0, 10).map((team) => (
									<Line
										key={team.Constructor.constructorId}
										type="monotone"
										dataKey={team.Constructor.constructorId}
										name={team.Constructor.name}
										stroke={getTeamColor(team.Constructor.constructorId, team.Constructor.name)}
										strokeWidth={3}
										dot={false}
										activeDot={{ r: 5, strokeWidth: 2, fill: '#09090b' }}
									/>
								))}
							</LineChart>
						</ResponsiveContainer>
					</div>
				)}

				{/* List Section (Right/Bottom) */}
				<div className={clsx(
					"flex-1 overflow-y-auto no-scrollbar pb-10",
					hasChart ? "xl:w-1/2 2xl:w-[45%]" : "w-full"
				)}>
					<div className={clsx(
						"w-full flex-col gap-2.5 flex",
						!hasChart && "grid grid-cols-1 xl:grid-cols-2 gap-4"
					)}>
						{loading && new Array(10).fill("").map((_, i) => <SkeletonRow key={i} />)}

						{!loading && category === "drivers" && useLiveDrivers && (Object.values(liveDriverPrediction!) as any[])
							.sort((a, b) => a.PredictedPosition - b.PredictedPosition)
							.map((standing) => {
								const driverDetail = liveDrivers![standing.RacingNumber];
								if (!driverDetail) return null;
								const teamColor = driverDetail.TeamColour ? `#${driverDetail.TeamColour}` : "#444";

								return (
									<div
										key={standing.RacingNumber}
										className={clsx(
											"group relative flex items-center gap-3 rounded-2xl border bg-gradient-to-r p-3 transition-all overflow-hidden glass hover:scale-[1.01]",
											getRankStyle(standing.PredictedPosition)
										)}
									>
										{/* Huge Background Driver Number watermark */}
										<span className="absolute -right-4 -bottom-6 pointer-events-none text-[80px] font-black italic text-white/[0.03] select-none">
											{standing.RacingNumber}
										</span>

										{/* Team color accent line */}
										<div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: teamColor }} />

										<div className="ml-1 flex items-center justify-center w-10 flex-col">
											<p className={clsx("text-xl font-black tabular-nums", getRankTextColor(standing.PredictedPosition))}>
												{standing.PredictedPosition}
											</p>
											{standing.CurrentPosition !== standing.PredictedPosition && (
												<div className="mt-0.5 scale-90"><NumberDiff old={standing.CurrentPosition} current={standing.PredictedPosition} /></div>
											)}
										</div>

										{/* Driver Headshot */}
										{driverDetail.HeadshotUrl ? (
											<div className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/5 relative shadow-inner">
												<Image src={driverDetail.HeadshotUrl} alt={driverDetail.LastName} fill className="object-cover object-top" />
											</div>
										) : (
											<div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 shrink-0">
												<span className="text-lg font-black text-white/40">{driverDetail.FirstName[0]}{driverDetail.LastName[0]}</span>
											</div>
										)}

										{/* Team Logo (if mapped) */}
										{getTeamLogo(driverDetail.TeamName) && (
											<div className="flex flex-col items-center justify-center w-6 h-6 rounded-full shrink-0 shadow-inner bg-black/20 backdrop-blur-md opacity-60 ml-1">
												<Image src={`/team-logos/${getTeamLogo(driverDetail.TeamName)}`} alt={driverDetail.TeamName} width={14} height={14} className="object-contain" />
											</div>
										)}

										<div className="flex-1 z-10 pl-2">
											<p className="text-base font-bold text-white tracking-tight truncate max-w-[150px] 2xl:max-w-[200px]">
												{driverDetail.FirstName} <span className="font-black uppercase">{driverDetail.LastName}</span>
											</p>
											<p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5 truncate max-w-[150px] 2xl:max-w-[200px]">{driverDetail.TeamName}</p>
										</div>

										<div className="text-right z-10 mr-1 flex flex-col items-end justify-center">
											<p className="text-2xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
												{standing.PredictedPoints}
											</p>
											{standing.CurrentPoints !== standing.PredictedPoints && (
												<div className="flex justify-end mt-0.5 opacity-80 scale-90">
													<NumberDiff old={standing.CurrentPoints} current={standing.PredictedPoints} />
												</div>
											)}
										</div>
									</div>
								);
							})
						}

						{!loading && category === "drivers" && !useLiveDrivers && apiDriverData.map((driver) => {
							const teamName = driver.Constructors[0]?.name || "Unknown";
							const teamId = driver.Constructors[0]?.constructorId;
							const logo = getTeamLogo(teamName, teamId);
							const teamColor = getTeamColor(teamId, teamName);

							// We use the driver code (if available from OpenF1 dictionary) to fetch headshot. Ergast sets 'Driver.code' (e.g., VER) occasionally but Jolpi standings don't always contain it. We match instead manually if Jolpi omits it.
							// Note: Using first 3 of familyName or known matches is a fallback, but the most robust match is full name parsing to acronym if 'code' isn't provided.
							const tName1 = driver.Driver.code || driver.Driver.familyName.replace(/\s/g, '').substring(0, 3).toUpperCase();
							const headshotUrl = driverHeadshots[tName1] || null;

							return (
								<div
									key={driver.position}
									className={clsx(
										"group relative flex items-center gap-3 rounded-2xl border bg-gradient-to-r p-3 transition-all overflow-hidden glass hover:scale-[1.01]",
										getRankStyle(driver.position)
									)}
								>
									{/* Huge Background Pos watermark */}
									<span className="absolute -right-4 -bottom-6 pointer-events-none text-[80px] font-black italic text-white/[0.03] select-none leading-none">
										P{driver.position}
									</span>

									<div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: teamColor }} />

									<div className="ml-1 flex items-center justify-center w-10">
										<p className={clsx("text-xl font-black tabular-nums", getRankTextColor(driver.position))}>
											{driver.position}
										</p>
									</div>

									{/* Driver Photo with F1 OpenF1 Matching */}
									{headshotUrl ? (
										<div className="flex items-center justify-center w-12 h-12 rounded-full border border-white/10 shrink-0 shadow-inner bg-white/5 relative overflow-hidden">
											<Image
												src={headshotUrl}
												alt={driver.Driver.familyName}
												fill
												className="object-cover object-top"
												unoptimized
											/>
										</div>
									) : (
										<div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 shrink-0">
											<span className="text-lg font-black text-white/40">{driver.Driver.givenName[0]}{driver.Driver.familyName[0]}</span>
										</div>
									)}

									{/* Team Logo (if mapped) */}
									{logo && (
										<div className="flex flex-col items-center justify-center w-6 h-6 rounded-full shrink-0 shadow-inner bg-black/20 backdrop-blur-md opacity-60 ml-1">
											<Image src={`/team-logos/${logo}`} alt={teamName} width={14} height={14} className="object-contain" />
										</div>
									)}

									<div className="flex-1 z-10 pl-2">
										<p className="text-base font-bold text-white tracking-tight truncate max-w-[150px] 2xl:max-w-[200px]">
											{driver.Driver.givenName} <span className="font-black uppercase">{driver.Driver.familyName}</span>
										</p>
										<p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5 truncate max-w-[150px] 2xl:max-w-[200px]" style={{ color: teamColor }}>
											{teamName}
										</p>
									</div>

									<div className="text-right z-10 mr-1 flex flex-col items-end justify-center">
										<p className="text-2xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
											{driver.points}
										</p>
									</div>
								</div>
							);
						})}

						{!loading && category === "constructors" && useLiveTeams && (Object.values(liveTeamPrediction!) as any[])
							.sort((a, b) => a.PredictedPosition - b.PredictedPosition)
							.map((team) => (
								<div
									key={team.TeamName}
									className={clsx(
										"group relative flex items-center gap-3 rounded-2xl border bg-gradient-to-r p-3 transition-all overflow-hidden glass hover:scale-[1.01]",
										getRankStyle(team.PredictedPosition)
									)}
								>
									{/* Background position mark */}
									<span className="absolute -right-4 -bottom-4 pointer-events-none text-[80px] font-black italic text-white/[0.02] select-none leading-none">
										P{team.PredictedPosition}
									</span>

									<div className="ml-1 flex flex-col items-center justify-center w-10">
										<p className={clsx("text-2xl font-black tabular-nums", getRankTextColor(team.PredictedPosition))}>
											{team.PredictedPosition}
										</p>
										{team.CurrentPosition !== team.PredictedPosition && (
											<div className="mt-0.5 scale-90"><NumberDiff old={team.CurrentPosition} current={team.PredictedPosition} /></div>
										)}
									</div>

									<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 p-2 border border-white/10 shrink-0 shadow-inner backdrop-blur-md">
										<Image
											src={`/team-logos/${team.TeamName.replaceAll(" ", "-").toLowerCase()}.svg`}
											alt={team.TeamName}
											width={32}
											height={32}
											className="object-contain drop-shadow-lg"
										/>
									</div>

									<p className="flex-1 z-10 text-lg font-bold uppercase tracking-tight text-white drop-shadow-sm truncate max-w-[200px] pl-2">
										{team.TeamName}
									</p>

									<div className="text-right z-10 mr-2 flex flex-col items-end justify-center">
										<p className="text-3xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
											{team.PredictedPoints} <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-[0]">PTS</span>
										</p>
										{team.CurrentPoints !== team.PredictedPoints && (
											<div className="flex justify-end mt-0.5 opacity-80 scale-90">
												<NumberDiff old={team.CurrentPoints} current={team.PredictedPoints} />
											</div>
										)}
									</div>
								</div>
							))
						}

						{!loading && category === "constructors" && !useLiveTeams && apiTeamData.map((team) => {
							const logo = getTeamLogo(team.Constructor.name, team.Constructor.constructorId);

							return (
								<div
									key={team.position}
									className={clsx(
										"group relative flex items-center gap-3 rounded-2xl border bg-gradient-to-r p-3 transition-all overflow-hidden glass hover:scale-[1.01]",
										getRankStyle(team.position)
									)}
								>
									{/* Background Position mark */}
									<span className="absolute -right-4 -bottom-4 pointer-events-none text-[80px] font-black italic text-white/[0.02] select-none leading-none">
										P{team.position}
									</span>

									<div className="ml-1 flex items-center justify-center w-10">
										<p className={clsx("text-2xl font-black tabular-nums", getRankTextColor(team.position))}>
											{team.position}
										</p>
									</div>

									{logo ? (
										<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 p-1.5 border border-white/10 shrink-0 shadow-inner backdrop-blur-md">
											<Image src={`/team-logos/${logo}`} alt={team.Constructor.name} width={32} height={32} className="object-contain drop-shadow-lg" />
										</div>
									) : (
										<div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 shrink-0 shadow-inner">
											<span className="text-sm font-black text-white/40">{team.Constructor.name[0]}</span>
										</div>
									)}

									<p className="flex-1 z-10 text-lg font-bold uppercase tracking-tight text-white drop-shadow-sm truncate max-w-[200px] pl-2">
										{team.Constructor.name}
									</p>

									<div className="text-right z-10 mr-2 flex flex-col items-end justify-center">
										<p className="text-3xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
											{team.points} <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-[0]">PTS</span>
										</p>
									</div>
								</div>
							);
						})}

						{!loading && ((category === "drivers" && !useLiveDrivers && apiDriverData.length === 0) || (category === "constructors" && !useLiveTeams && apiTeamData.length === 0)) && (
							<div className="col-span-1 xl:col-span-2 mt-12 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/50 p-12 glass shadow-2xl relative overflow-hidden">
								<div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

								<div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6 relative shadow-inner">
									<div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(255,40,0,0.3)] bg-f1-accent/10 blur-xl" />
									<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 relative z-10">
										<circle cx="12" cy="12" r="10"></circle>
										<line x1="12" y1="8" x2="12" y2="12"></line>
										<line x1="12" y1="16" x2="12.01" y2="16"></line>
									</svg>
								</div>

								<h2 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">Data Unavailable</h2>
								<p className="mt-3 text-sm text-zinc-400 max-w-md text-center">
									We couldn't find official {category} standings for the <span className="text-white font-bold">{selectedYear}</span> season in our historical database.
								</p>

								<button
									onClick={() => setSelectedYear(currentYear)}
									className="mt-8 rounded-full bg-white/10 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/20 hover:scale-105 border border-white/10"
								>
									Return to Current Season
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
