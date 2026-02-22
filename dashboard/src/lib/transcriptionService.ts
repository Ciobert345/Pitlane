import { useTranscriptionStore } from "@/stores/useTranscriptionStore";

class TranscriptionService {
    private worker: Worker | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            // Initialize worker
            this.worker = new Worker(new URL("./transcription.worker.ts", import.meta.url));
            console.log("[TranscriptionService] Worker instance created from local path.");

            this.worker.onmessage = (event) => {
                const { status, text, error, id } = event.data;

                if (status === "success") {
                    useTranscriptionStore.getState().setTranscription(id, text);
                } else if (status === "error") {
                    useTranscriptionStore.getState().setError(id, error);
                }
            };
        }
    }

    async transcribe(id: string, audioUrl: string) {
        if (!this.worker) return;

        useTranscriptionStore.getState().setLoading(id, true);

        try {
            console.log(`[TranscriptionService] Starting fetch for ${id}: ${audioUrl}`);
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();

            // Decode audio on main thread
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            // Get raw audio data (16kHz mono)
            let audioData = audioBuffer.getChannelData(0);

            // If stereo, convert to mono
            if (audioBuffer.numberOfChannels > 1) {
                const channel2 = audioBuffer.getChannelData(1);
                audioData = audioData.map((v, i) => (v + channel2[i]) / 2);
            }

            console.log(`[TranscriptionService] Audio decoded. Sample count: ${audioData.length}`);
            this.worker.postMessage({ id, audioData });

            // Cleanup context
            await audioCtx.close();
        } catch (error: any) {
            console.error(`[TranscriptionService] Error decoding audio for ${id}:`, error);
            useTranscriptionStore.getState().setError(id, `Audio decoding failed: ${error.message}`);
        }
    }
}

export const transcriptionService = new TranscriptionService();
