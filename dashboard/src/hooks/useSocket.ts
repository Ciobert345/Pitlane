import { useEffect, useState } from "react";

import type { MessageInitial, MessageUpdate } from "@/types/message.type";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { env } from "@/env";

type Props = {
	handleInitial: (data: MessageInitial) => void;
	handleUpdate: (data: MessageUpdate) => void;
};

export const useSocket = ({ handleInitial, handleUpdate }: Props) => {
	const useSimulator = useSettingsStore((s) => s.useSimulator);
	const [connected, setConnected] = useState<boolean>(false);

	useEffect(() => {
		// Forza sempre l'uso del backend Railway in produzione
		const baseUrl = env.NEXT_PUBLIC_LIVE_URL;
		const sse = new EventSource(`${baseUrl}/api/realtime`);

		sse.onerror = () => {
			setConnected(false);
			if (process.env.NODE_ENV === "development") {
				console.warn("[Socket] SSE connection error (backend unreachable or CORS)");
			}
		};
		sse.onopen = () => {
			console.log(`[Socket] SSE Connected to Local backend`);
			setConnected(true);
		};

		sse.addEventListener("initial", (message) => {
			console.log("[Socket] Received Initial Data");
			handleInitial(JSON.parse(message.data));
		});

		sse.addEventListener("update", (message) => {
			// console.log("[Socket] Received Update"); // Too noisy for telemetry
			handleUpdate(JSON.parse(message.data));
		});

		return () => sse.close();
	}, []);

	return { connected };
};
