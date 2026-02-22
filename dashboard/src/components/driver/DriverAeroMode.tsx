import clsx from "clsx";

type Props = {
	on: boolean;
	possible: boolean;
	inPit: boolean;
	pitOut: boolean;
};

/**
 * DriverAeroMode Component (2026 Regulation Style)
 * Mappings:
 * - DRS Active -> X-MODE (Low Drag)
 * - DRS Possible -> OVERTAKE (Manual Override)
 * - Default -> Z-MODE (High Downforce)
 */
export default function DriverAeroMode({ on, possible, inPit, pitOut }: Props) {
	const pit = inPit || pitOut;

	return (
		<span
			className={clsx(
				"text-[10px] inline-flex h-8 w-full items-center justify-center rounded-md border-2 font-mono font-black transition-all duration-200",
				{
					// Z-MODE (Default/Neutral)
					"border-zinc-800 text-zinc-700 bg-zinc-950/40": !pit && !on && !possible,
					// OVERTAKE (Manual Override available)
					"border-amber-500/50 text-amber-500 bg-amber-500/5": !pit && !on && possible,
					// X-MODE (Low Drag active)
					"border-emerald-500 text-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]": !pit && on,
					// PIT
					"border-cyan-500 text-cyan-500 bg-cyan-500/5": pit,
				},
			)}
		>
			{pit ? "PIT" : on ? "X-MODE" : possible ? "OVERTAKE" : "Z-MODE"}
		</span>
	);
}
