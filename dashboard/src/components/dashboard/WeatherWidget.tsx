"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { fetchCoords } from "@/lib/geocode";
import { getRainviewer } from "@/lib/rainviewer";
import { useDataStore } from "@/stores/useDataStore";

export default function WeatherWidget() {
    const meeting = useDataStore((state) => state.state?.SessionInfo?.Meeting);
    const [loading, setLoading] = useState<boolean>(true);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map>(null);
    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
    const [liveTime, setLiveTime] = useState<number | null>(null);

    const handleMapLoad = async (map: Map) => {
        const rainviewer = await getRainviewer();
        if (!rainviewer) return;

        // Ensure host has explicit https protocol to avoid issues with local dev
        let host = rainviewer.host;
        if (host.startsWith("//")) host = `https:${host}`;
        if (!host.startsWith("http")) host = `https://${host}`;

        // Pick the frame closest to NOW
        const allPossibleLiveFrames = [
            ...rainviewer.radar.past.slice(-2),
            ...rainviewer.radar.nowcast.slice(0, 1)
        ];

        if (allPossibleLiveFrames.length === 0) return;

        const now = Math.floor(Date.now() / 1000);
        const bestFrame = allPossibleLiveFrames.reduce((prev, curr) => {
            return Math.abs(curr.time - now) < Math.abs(prev.time - now) ? curr : prev;
        });

        // Rainviewer path usually is "/v2/radar/TIMESTAMP"
        // We need to construct: host/path/256/{z}/{x}/{y}/COLOR/SMOOTH_OPTION.png
        const cleanPath = bestFrame.path.replace(/^\/+/, "");

        // Using PNG as it's more universally compatible with MapLibre tile requests across different hosts
        const tileUrl = `${host}/${cleanPath}/256/{z}/{x}/{y}/2/1_1.png`;

        // Remove old layer if exists
        try {
            if (map.getLayer("rainviewer-live")) {
                map.removeLayer("rainviewer-live");
                map.removeSource("rainviewer-live");
            }
        } catch (e) {
            console.warn("WeatherWidget: Layer refresh error", e);
        }

        map.addSource("rainviewer-live", {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 7, // Rainviewer Free API restricts tile requests to max zoom 7
        });

        map.addLayer({
            id: "rainviewer-live",
            type: "raster",
            source: "rainviewer-live",
            paint: {
                "raster-opacity": 0.8,
                "raster-resampling": "nearest",
            },
        });

        setLiveTime(bestFrame.time);
    };

    // Auto-refresh radar data every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (mapRef.current) {
                handleMapLoad(mapRef.current);
            }
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        (async () => {
            if (!mapContainerRef.current || !meeting) return;

            const [coordsC, coordsA] = await Promise.all([
                fetchCoords(`${meeting.Country.Name}, ${meeting.Location} circuit`),
                fetchCoords(`${meeting.Country.Name}, ${meeting.Location} autodrome`),
            ]);

            const circuitCoords = coordsC || coordsA;
            setCoords(circuitCoords);

            // Re-check container after await, as component might have unmounted
            if (!mapContainerRef.current) return;

            const libMap = new maplibregl.Map({
                container: mapContainerRef.current,
                style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
                center: circuitCoords ? [circuitCoords.lon, circuitCoords.lat] : [0, 0],
                zoom: 12,
                attributionControl: false,
                interactive: true,
            });

            libMap.on("load", async () => {
                setLoading(false);
                if (circuitCoords) {
                    new Marker({ element: createMarkerElement() }).setLngLat([circuitCoords.lon, circuitCoords.lat]).addTo(libMap);
                }
                await handleMapLoad(libMap);
            });

            mapRef.current = libMap;
        })();

        return () => {
            mapRef.current?.remove();
        };
    }, [meeting]);

    const reposition = () => {
        if (!mapRef.current || !coords) return;
        mapRef.current.flyTo({
            center: [coords.lon, coords.lat],
            zoom: 12,
            essential: true
        });
    };

    return (
        <div className="relative h-full w-full overflow-hidden group">
            <div ref={mapContainerRef} className="absolute h-full w-full" />

            {/* HUD Header Overlay */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="h-1 w-3 rounded-full bg-f1-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Weather Radar</span>
                    <span className="text-[8px] font-black bg-f1-accent/20 text-f1-accent px-1 rounded border border-f1-accent/20">LIVE</span>
                </div>
                {liveTime && (
                    <span className="text-[9px] font-bold text-zinc-400 tabular-nums ml-5">
                        {new Date(liveTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>

            {/* Floating Controls */}
            {!loading && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={reposition}
                        className="bg-black/80 hover:bg-black text-white px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                    >
                        Reposition
                    </button>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-f1-accent border-t-transparent" />
                </div>
            )}
        </div>
    );
}

function createMarkerElement() {
    const container = document.createElement("div");
    container.className = "flex items-center justify-center";

    const core = document.createElement("div");
    core.className = "h-2.5 w-2.5 rounded-full bg-f1-accent border border-white shadow-[0_0_8px_rgba(255,24,30,0.6)]";

    container.appendChild(core);
    return container;
}
