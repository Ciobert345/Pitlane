import { pipeline, env } from "@xenova/transformers";

// Skip local check to download from Hugging Face hub
env.allowLocalModels = false;

console.log("[Worker] Transcription worker script loaded.");

class TranscriptionPipeline {
    static task = "automatic-speech-recognition";
    static model = "Xenova/whisper-tiny.en";
    static instance: any = null;

    static async getInstance(progress_callback?: (progress: any) => void) {
        if (this.instance === null) {
            console.log("[Worker] Initializing pipeline for model:", this.model);
            this.instance = await pipeline(this.task as any, this.model, { progress_callback });
            console.log("[Worker] Pipeline initialized successfully.");
        }
        return this.instance;
    }
}

self.onmessage = async (event) => {
    const { audioData, id } = event.data;
    console.log("[Worker] Message received, audio data length:", audioData?.length, "id:", id);

    try {
        const transcriber = await TranscriptionPipeline.getInstance((progress) => {
            if (progress.status === "progress") {
                console.log(`[Worker] Loading model: ${progress.file} (${Math.round(progress.loaded)}%)`);
            }
            self.postMessage({ status: "progress", progress, id });
        });

        if (!audioData) {
            throw new Error("No audio data received in worker.");
        }

        console.log("[Worker] Starting transcription for audio data...");

        const output = await transcriber(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
            language: "english",
            task: "transcribe",
        });

        console.log("[Worker] Transcription successful:", output.text);

        self.postMessage({
            status: "success",
            text: output.text,
            id,
        });
    } catch (error: any) {
        console.error("[Worker] Error during transcription:", error);
        self.postMessage({
            status: "error",
            error: error.message,
            id,
        });
    }
};
