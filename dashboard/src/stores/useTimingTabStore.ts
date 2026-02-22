import { create } from "zustand";

export type TimingTab = "timing" | "sectors" | "tires" | "carmetrics";

type TimingTabStore = {
    activeTab: TimingTab;
    setTab: (tab: TimingTab) => void;
};

export const useTimingTabStore = create<TimingTabStore>()((set) => ({
    activeTab: "timing",
    setTab: (tab) => set({ activeTab: tab }),
}));
