"use client";

import clsx from "clsx";
import { useSettingsStore } from "@/stores/useSettingsStore";

type Props = {
	connected?: boolean;
};

export default function ConnectionStatus({ connected }: Props) {
	const useSimulator = useSettingsStore((s) => s.useSimulator);

	return (
		<div className="flex items-center gap-2">
			<div className={clsx("size-2.5 rounded-full transition-colors duration-500", connected ? "bg-emerald-500" : "animate-pulse bg-red-500")} />
			{useSimulator && (
				<span className="rounded bg-f1-accent/10 border border-f1-accent/30 px-1.5 py-0.5 text-[8px] font-black uppercase text-f1-accent">
					SIM
				</span>
			)}
		</div>
	);
}
