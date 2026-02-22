"use client";

import { createContext, useContext, type ReactNode } from "react";

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
	const { handleInitial, handleUpdate, maxDelay } = useDataEngine(stores);
	const { connected } = useSocket({ handleInitial, handleUpdate });

	return (
		<LiveDataContext.Provider value={{ connected, maxDelay }}>
			{children}
		</LiveDataContext.Provider>
	);
}

export function useLiveData() {
	return useContext(LiveDataContext);
}
