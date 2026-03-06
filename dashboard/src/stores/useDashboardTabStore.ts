import { create } from "zustand";

export type DashboardTab = "timing" | "track" | "feeds" | "analysis";

type DashboardTabStore = {
    activeTab: DashboardTab;
    setTab: (tab: DashboardTab) => void;
};

export const useDashboardTabStore = create<DashboardTabStore>()((set) => ({
    activeTab: "timing",
    setTab: (tab) => set({ activeTab: tab }),
}));
