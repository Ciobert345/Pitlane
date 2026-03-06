"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    pitlane?: {
      isElectron?: boolean;
      platform?: string;
      close: () => void;
      minimize: () => void;
      maximize: () => void;
      isMaximized: () => Promise<boolean>;
    };
  }
}

export function useIsElectron() {
  const [isElectron, setIsElectron] = useState(false);
  useEffect(() => {
    setIsElectron(Boolean(typeof window !== "undefined" && window.pitlane?.isElectron));
  }, []);
  return isElectron;
}


export const electronDragStyle = { WebkitAppRegion: "drag", WebkitUserSelect: "none" } as CSSProperties;
export const electronNoDragStyle = { WebkitAppRegion: "no-drag" } as CSSProperties;

export default function ElectronWindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = useIsElectron();

  useEffect(() => {
    if (!isElectron || !window.pitlane?.isMaximized) return;
    const update = () => window.pitlane?.isMaximized().then(setIsMaximized);
    update();
    const interval = setInterval(update, 300);
    return () => clearInterval(interval);
  }, [isElectron]);

  if (!isElectron) return null;

  const onMaximize = () => {
    window.pitlane?.maximize();
    window.pitlane?.isMaximized().then(setIsMaximized);
  };

  return (
    <div className="flex items-stretch" style={electronNoDragStyle}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.pitlane?.minimize();
        }}
        className="flex h-8 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white md:h-9 md:w-12"
        aria-label="Minimizza"
      >
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2 6h8" />
        </svg>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onMaximize();
        }}
        className="flex h-8 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white md:h-9 md:w-12"
        aria-label={isMaximized ? "Ripristina" : "Ingrandisci"}
      >
        {isMaximized ? (
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x={2} y={4} width={6} height={6} />
            <path d="M4 2h6v6" />
          </svg>
        ) : (
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x={0} y={0} width={12} height={12} />
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.pitlane?.close();
        }}
        className="flex h-8 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-400 md:h-9 md:w-12"
        aria-label="Chiudi"
      >
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2 2l8 8M10 2L2 10" />
        </svg>
      </button>
    </div>
  );
}
