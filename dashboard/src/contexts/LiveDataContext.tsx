"use client";

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";

import { useStores } from "@/hooks/useStores";
import { useDataEngine } from "@/hooks/useDataEngine";
import { useSocket } from "@/hooks/useSocket";

type LiveDataContextValue = {
	connected: boolean;
	maxDelay: number;
};

const LiveDataContext = createContext<LiveDataContextValue>({
	connected: false,
	maxDelay: 0,
});

export function LiveDataProvider({ children }: { children: ReactNode }) {
	const stores = useStores();
	const [connected, setConnected] = useState(false);
	const { handleInitial, handleUpdate, maxDelay } = useDataEngine({ ...stores, connected });
	const { connected: socketConnected } = useSocket({ handleInitial, handleUpdate });

	useEffect(() => {
		if (socketConnected !== connected) {
			setConnected(socketConnected);
		}
	}, [socketConnected, connected]);

	const value = useMemo(() => ({ connected, maxDelay }), [connected, maxDelay]);

	return (
		<LiveDataContext.Provider value={value}>
			{children}
		</LiveDataContext.Provider>
	);
}

export function useLiveData() {
	return useContext(LiveDataContext);
}
