import { create } from "zustand";

type FocusStore = {
    focusedDriver: string | null;
    setFocusedDriver: (nr: string) => void;
    clearFocusedDriver: () => void;
};

export const useFocusStore = create<FocusStore>()((set) => ({
    focusedDriver: null,
    setFocusedDriver: (nr: string) => set({ focusedDriver: nr }),
    clearFocusedDriver: () => set({ focusedDriver: null }),
}));
