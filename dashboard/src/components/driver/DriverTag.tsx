import clsx from "clsx";

type Props = {
	teamColor: string;
	short: string;
	position?: number;
	className?: string;
};

export default function DriverTag({ position, teamColor, short, className }: Props) {
	return (
		<div
			id="walkthrough-driver-position"
			className={clsx(
				"relative flex w-fit items-center justify-between gap-1.5 rounded-lg border border-white/10 bg-zinc-900/50 p-1 font-black shadow-lg",
				className,
			)}
		>
			<div
				className="absolute inset-y-0 left-0 w-1 rounded-l-lg"
				style={{ backgroundColor: `#${teamColor}` }}
			/>

			{position && <p className="pl-2 pr-1 text-lg leading-none tracking-tighter text-white">{position}</p>}

			<div className="flex h-6 items-center justify-center rounded bg-white px-1.5">
				<p className="font-mono text-[11px] font-bold" style={{ color: `#${teamColor}` }}>
					{short}
				</p>
			</div>
		</div>
	);
}
