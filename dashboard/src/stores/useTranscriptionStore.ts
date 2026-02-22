import { create } from "zustand";

type TranscriptionState = {
    transcriptions: Record<string, string>;
    loading: Record<string, boolean>;
    error: Record<string, string | null>;

    setTranscription: (id: string, text: string) => void;
    setLoading: (id: string, isLoading: boolean) => void;
    setError: (id: string, error: string | null) => void;
};

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
    transcriptions: {},
    loading: {},
    error: {},

    setTranscription: (id, text) =>
        set((state) => ({
            transcriptions: { ...state.transcriptions, [id]: text },
            loading: { ...state.loading, [id]: false },
        })),

    setLoading: (id, isLoading) =>
        set((state) => ({
            loading: { ...state.loading, [id]: isLoading },
        })),

    setError: (id, error) =>
        set((state) => ({
            error: { ...state.error, [id]: error },
            loading: { ...state.loading, [id]: false },
        })),
}));
