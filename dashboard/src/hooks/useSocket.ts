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
		const baseUrl = useSimulator ? "http://localhost:4005" : env.NEXT_PUBLIC_LIVE_URL;
		console.log("[Socket] Connecting to:", `${baseUrl}/api/realtime`);
		
		// Se l'URL è example.com, non tentare la connessione
		if (baseUrl.includes("example.com")) {
			console.log("[Socket] Example URL detected, skipping connection");
			return;
		}

		const sse = new EventSource(`${baseUrl}/api/realtime`);

		sse.onerror = (e) => {
			console.error("[Socket] SSE Error:", e);
			setConnected(false);
		};
		sse.onopen = () => {
			console.log(`[Socket] SSE Connected (${useSimulator ? "SIMULATOR" : "LIVE FEED"})`);
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [useSimulator]);

	return { connected };
};
