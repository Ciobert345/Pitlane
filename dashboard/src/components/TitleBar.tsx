"use client";

import { useEffect } from "react";
import ElectronWindowControls, { electronDragStyle, useIsElectron } from "@/components/ElectronWindowControls";

export default function TitleBar() {
    const isElectron = useIsElectron();

    useEffect(() => {
        if (isElectron) {
            document.documentElement.classList.add('electron');
        } else {
            document.documentElement.classList.remove('electron');
        }
    }, [isElectron]);

    if (!isElectron) return null;

    return (
        <div
            className="flex h-10 w-full shrink-0 relative z-[100] items-center justify-between bg-zinc-950 px-2"
            style={electronDragStyle}
        >
            <div className="flex items-center gap-2 px-2 text-xs font-semibold tracking-wider text-zinc-500">
                Pitlane
            </div>

            {/* Controls on the right end */}
            <div className="flex items-center">
                <ElectronWindowControls />
            </div>
        </div>
    );
}
