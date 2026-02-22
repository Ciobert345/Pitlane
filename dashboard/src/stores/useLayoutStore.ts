import { persist, createJSONStorage } from "zustand/middleware";
import { create } from "zustand";

export type LayoutMode = "race" | "focus";

type LayoutStore = {
    layoutMode: LayoutMode;
    setLayoutMode: (mode: LayoutMode) => void;
};

export const useLayoutStore = create<LayoutStore>()(
    persist(
        (set) => ({
            layoutMode: "race",
            setLayoutMode: (mode: LayoutMode) => set({ layoutMode: mode }),
        }),
        {
            name: "layout-storage",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
