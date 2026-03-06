"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "motion/react";
import {
    Tv, Monitor, RefreshCw, Loader2, Play, Pause,
    Volume2, VolumeX, Maximize2, List, ChevronRight,
    Activity, ShieldCheck, Zap, Globe, Menu, X, Info
} from "lucide-react";
import { getLiveRacingEvents } from "@/lib/liveTransmission";
import type { GamingEvent, Channel } from "@/lib/liveTransmission";
import { useSidebarStore } from "@/stores/useSidebarStore";

// ── Configuration ───────────────────────────────────────────────

const PINNED_CHANNELS: GamingEvent = {
    id: 'pinned',
    home_team: null,
    away_team: null,
    title: 'Racing Hub',
    sport: 'Motorsport',
    league: 'Quick Launch',
    timestamp: 0,
    channels: [
        { name: 'SkySportsF1[IT]', link: 'eplayerskyf1it' },
        { name: 'SkySportsF1[UK]', link: 'eplayerskyf1' },
        { name: 'SkySportsMotoGP[UK]', link: 'eplayerskymotogp' },
        { name: 'TV8[IT]', link: 'tv8italy' },
        { name: 'SkySportsMainEvent[UK]', link: 'eplayerskymain2' },
    ]
};

function getLang(name: string): string {
    return name.match(/\[([^\]]+)\]/)?.[1] ?? 'LIVE';
}
function getChName(name: string): string {
    return name.replace(/\[[^\]]+\]/, '').trim();
}

// ── Components ───────────────────────────────────────────────────

const TechBadge = ({ children, color = "f1-neon" }: { children: React.ReactNode, color?: string }) => (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-${color}/10 border border-${color}/20 text-${color}`}>
        {children}
    </div>
);

// ── Native HLS Player Component ──────────────────────────────────

interface NativePlayerProps {
    url: string;
    channelName: string;
    onToggleSidebar?: () => void;
}

function NativeHlsPlayer({ url, channelName }: NativePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [buffering, setBuffering] = useState(true);
    const [stats, setStats] = useState({ bitrate: 0, latency: 0 });
    const timerRef = useRef<number | null>(null);
    const openSidebar = useSidebarStore((state) => state.open);

    const resetTimer = useCallback(() => {
        setShowControls(true);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setShowControls(false), 4000);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
            });
            hlsRef.current = hls;
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => { });
                setBuffering(false);
            });
            hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                const level = hls.levels[data.level];
                setStats(s => ({ ...s, bitrate: level.bitrate }));
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.play().catch(() => { });
            setBuffering(false);
        }

        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [url]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
    };

    return (
        <div
            className="relative w-full h-full bg-black group overflow-hidden select-none"
            onMouseMove={resetTimer}
            onPointerMove={resetTimer}
            onMouseLeave={() => setShowControls(false)}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                muted={muted}
                playsInline
                crossOrigin="anonymous"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onWaiting={() => setBuffering(true)}
                onPlaying={() => setBuffering(false)}
                onClick={togglePlay}
            />

            {/* Ambient Shadow Overlay */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] opacity-60" />

            {/* HUD Overlays - Signal Status (Always visible when controls on) */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="absolute top-8 left-8 flex flex-col gap-4 pointer-events-none"
                    >
                        <div className="glass bg-black/40 backdrop-blur-2xl px-4 py-3 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-f1-neon animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Establish Uplink</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-zinc-500 uppercase">Bitrate</span>
                                    <span className="text-[12px] font-mono font-bold text-f1-neon">{(stats.bitrate / 1000000).toFixed(1)} Mbps</span>
                                </div>
                                <div className="w-px h-8 bg-white/5" />
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-zinc-500 uppercase">Latency</span>
                                    <span className="text-[12px] font-mono font-bold text-cyan-400">1.2s</span>
                                </div>
                                <div className="w-px h-8 bg-white/5" />
                                <div className="flex items-center gap-2">
                                    <Activity size={16} className="text-zinc-600" />
                                    <ShieldCheck size={16} className="text-f1-neon" />
                                </div>
                            </div>
                        </div>

                        <TechBadge>Encrypted Node: {getLang(channelName)}</TechBadge>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HUD: Buttons */}
            <AnimatePresence>
                {showControls && (
                    <div className="absolute top-8 right-8 flex gap-3 z-50">
                        {/* Global Navigation Hub (Requested by user) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); openSidebar(); }}
                            className="size-12 glass bg-white/5 hover:bg-cyan-400/20 border border-white/10 hover:border-cyan-400/40 rounded-2xl flex items-center justify-center transition-all group scale-100 hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                            title="Open Global Navigation"
                        >
                            <Menu size={20} className="text-white group-hover:text-cyan-400" />
                        </button>
                    </div>
                )}
            </AnimatePresence>

            {/* Buffering Overlay */}
            <AnimatePresence>
                {buffering && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl z-[60]"
                    >
                        <div className="relative">
                            <Loader2 className="text-f1-neon animate-spin" size={64} strokeWidth={1} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Zap size={24} className="text-f1-neon animate-pulse" />
                            </div>
                        </div>
                        <span className="mt-6 text-[11px] font-black uppercase tracking-[0.5em] text-white animate-pulse">Synchronizing Data Feed</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Island Controls */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
                    >
                        <div className="glass bg-black/60 backdrop-blur-3xl px-6 py-4 rounded-3xl border border-white/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] flex items-center gap-6">
                            <button
                                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white hover:text-f1-neon transition-all"
                            >
                                {playing ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
                            </button>

                            <div className="w-px h-8 bg-white/10" />

                            <div className="flex items-center gap-4 group/vol">
                                <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="text-white/60 hover:text-white transition-colors">
                                    {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <div className="relative w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="absolute inset-y-0 left-0 bg-f1-neon"
                                        animate={{ width: `${(muted ? 0 : volume) * 100}%` }}
                                    />
                                    <input
                                        type="range" min="0" max="1" step="0.01"
                                        value={muted ? 0 : volume}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            setVolume(v);
                                            setMuted(v === 0);
                                            if (videoRef.current) videoRef.current.volume = v;
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="w-px h-8 bg-white/10" />

                            <button
                                onClick={(e) => { e.stopPropagation(); videoRef.current?.requestFullscreen(); }}
                                className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                            >
                                <Maximize2 size={20} />
                            </button>
                        </div>

                        <div className="glass bg-black/60 backdrop-blur-3xl px-6 py-4 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[12px] font-black text-white uppercase tracking-wider">{getChName(channelName)}</span>
                                <span className="text-[8px] font-bold text-f1-neon uppercase tracking-widest leading-none">Status: Encrypted Stream</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main LiveTransmission Component ──────────────────────────────

interface StreamState {
    type: 'idle' | 'loading' | 'native' | 'iframe';
    url: string;
    channel: Channel | null;
    event: GamingEvent | null;
}

export default function LiveTransmission() {
    const [events, setEvents] = useState<GamingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState<'all' | 'f1' | 'other'>('all');
    const [watchDomain, setWatchDomain] = useState("php.adffdafdsafds.sbs");
    const [stream, setStream] = useState<StreamState>({
        type: 'idle', url: '', channel: null, event: null
    });

    const openSidebar = useSidebarStore((state) => state.open);

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [evts, domainData] = await Promise.all([
                getLiveRacingEvents(),
                fetch('/api/racing/watchdomain').then(r => r.json()),
            ]);
            setEvents(evts);
            if (domainData?.domain) setWatchDomain(domainData.domain);
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const t = setInterval(fetchData, 5 * 60 * 1000);
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'M3U8_FOUND' && e.data.url) {
                const proxiedUrl = `/api/racing/proxy?url=${encodeURIComponent(e.data.url)}`;
                setStream(prev => ({ ...prev, type: 'native', url: proxiedUrl }));
            }
        };
        window.addEventListener('message', handleMessage);
        return () => {
            clearInterval(t);
            window.removeEventListener('message', handleMessage);
        };
    }, [fetchData]);

    const selectChannel = (event: GamingEvent, ch: Channel) => {
        const proxyUrl = `/api/player?channel=${encodeURIComponent(ch.name)}&domain=${encodeURIComponent(watchDomain)}`;
        setStream({ type: 'loading', url: proxyUrl, channel: ch, event: event });
        setTimeout(() => {
            setStream(prev => {
                if (prev.type === 'loading' && prev.channel?.link === ch.link) return { ...prev, type: 'iframe' };
                return prev;
            });
        }, 8000);
    };

    const allEvents = useMemo(() => [PINNED_CHANNELS, ...events], [events]);

    const filteredEvents = useMemo(() => {
        if (activeCategory === 'all') return allEvents;
        if (activeCategory === 'f1') return allEvents.filter(e => e.sport?.toLowerCase().includes('f1') || e.league?.toLowerCase().includes('f1') || e.channels.some(c => c.name.toLowerCase().includes('f1')));
        return allEvents;
    }, [allEvents, activeCategory]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="size-24 rounded-full border border-white/5 flex items-center justify-center">
                            <Zap size={32} className="text-f1-neon animate-pulse" />
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 border-f1-neon border-t-transparent"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[12px] font-black uppercase tracking-[0.5em] text-white">Pitlane Core</span>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Establishing Secure Node Link</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden bg-black relative font-sans">

            {/* Ambient Animated Background Pulse */}
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] bg-gradient-to-br from-f1-neon/5 via-transparent to-cyan-500/5 blur-[120px]"
                />
            </div>

            {/* ── Fixed Sidebar: Glassmorphic Channel List ────────────────── */}
            <div className="w-80 flex-shrink-0 z-40 p-4 pl-6">
                <div className="h-full flex flex-col glass bg-zinc-950/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Satellite Hub</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="size-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Nodes Active: {events.length + PINNED_CHANNELS.channels.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="px-8 pb-6 flex items-center gap-2">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === 'all' ? 'bg-f1-neon text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setActiveCategory('f1')}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === 'f1' ? 'bg-f1-neon text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                        >
                            Speed
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 space-y-8 pb-8">
                        {filteredEvents.map((event) => (
                            <div key={event.id} className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                    <span className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-600 whitespace-nowrap">
                                        {event.league || event.sport}
                                    </span>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                                </div>

                                <div className="grid gap-2">
                                    {event.channels.map(ch => {
                                        const isActive = stream.channel?.link === ch.link && stream.event?.id === event.id;
                                        return (
                                            <button
                                                key={ch.link}
                                                onClick={() => selectChannel(event, ch)}
                                                className={`relative group flex items-center gap-4 p-4 rounded-3xl transition-all border ${isActive
                                                    ? 'bg-f1-neon/5 border-f1-neon/30 text-white shadow-[0_10px_30px_-10px_rgba(225,6,0,0.1)]'
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white'
                                                    }`}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="active-pill"
                                                        className="absolute inset-0 border border-f1-neon/40 rounded-3xl"
                                                    />
                                                )}
                                                <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-f1-neon text-white shadow-[0_0_15px_rgba(225,6,0,0.4)]' : 'bg-white/5 text-zinc-600 group-hover:text-zinc-300'}`}>
                                                    <Globe size={18} strokeWidth={isActive ? 3 : 2} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-[12px] font-black leading-tight tracking-tight">
                                                        {getChName(ch.name)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{getLang(ch.name)}</span>
                                                        {isActive && <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity }} className="size-1 rounded-full bg-f1-neon" />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-8 pt-4 border-t border-white/5 flex items-center justify-between bg-black/20">
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Signal Optimized</span>
                        </div>
                        <button onClick={fetchData} className="text-zinc-600 hover:text-white transition-colors">
                            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Viewport: Player Area ─────────────────────────── */}
            <div className="flex-1 relative bg-black transition-all duration-700 ease-in-out">

                <AnimatePresence mode="wait">
                    {stream.type === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center"
                        >
                            <div className="relative mb-8">
                                <div className="size-48 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                    <Monitor size={64} className="text-zinc-800" strokeWidth={1} />
                                </div>
                                <div className="absolute inset-x-0 -bottom-4 flex justify-center">
                                    <TechBadge color="zinc-600">Off-Grid</TechBadge>
                                </div>
                            </div>
                            <div className="text-center">
                                <h1 className="text-2xl font-black text-white/20 uppercase tracking-[0.6em] ml-2">Race Control</h1>
                                <p className="text-[10px] font-bold text-zinc-700 tracking-[0.4em] uppercase mt-4">Authorized Personnel Only</p>
                            </div>

                            <div className="mt-12 text-center text-zinc-600 font-black uppercase tracking-widest text-[10px]">
                                Select a feed node from the Satellite Hub
                            </div>

                            {/* Global Nav for Idle State */}
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={openSidebar}
                                className="absolute top-8 right-8 size-12 glass bg-white/5 hover:bg-cyan-400/20 border border-white/10 hover:border-cyan-400/40 rounded-2xl flex items-center justify-center transition-all group scale-100 hover:scale-110 active:scale-95 z-50"
                                title="Open Global Navigation"
                            >
                                <Menu size={20} className="text-white group-hover:text-cyan-400" />
                            </motion.button>
                        </motion.div>
                    )}

                    {stream.type === 'loading' && (
                        <motion.div
                            key="loading"
                            className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            <iframe src={stream.url} className="absolute opacity-0 pointer-events-none w-px h-px" sandbox="allow-scripts allow-same-origin allow-forms" />

                            <div className="flex flex-col items-center gap-10">
                                <div className="relative">
                                    <div className="size-40 rounded-full border-[10px] border-white/5 flex items-center justify-center">
                                        <div className="absolute inset-[10px] rounded-full border-t-4 border-f1-neon animate-[spin_1.5s_linear_infinite]" />
                                        <div className="absolute inset-[25px] rounded-full border-b-2 border-cyan-400 animate-[spin_2s_linear_infinite_reverse]" />
                                        <Globe size={40} className="text-white/20" />
                                    </div>
                                </div>
                                <div className="text-center space-y-4">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[12px] font-black uppercase tracking-[0.8em] text-white">Handshake</span>
                                        <span className="text-[9px] font-bold text-f1-neon uppercase tracking-widest mt-2">Bypassing Encryption Protocol</span>
                                    </div>
                                    <div className="flex gap-1 justify-center">
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    height: [4, 16, 4],
                                                    backgroundColor: ["#e10600", "#22d3ee", "#e10600"]
                                                }}
                                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                className="w-1 rounded-full bg-zinc-800"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {stream.type === 'native' && (
                        <motion.div key="native" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <NativeHlsPlayer
                                url={stream.url}
                                channelName={stream.channel?.name || 'Unknown'}
                            />
                        </motion.div>
                    )}

                    {stream.type === 'iframe' && (
                        <motion.div key="iframe" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <iframe src={stream.url} className="w-full h-full border-none bg-black" allow="autoplay; fullscreen" allowFullScreen />
                            <div className="absolute top-8 right-8 flex items-center gap-3 z-50">
                                <TechBadge color="yellow-500">Iframe Fallback Layer</TechBadge>

                                <button
                                    onClick={openSidebar}
                                    className="size-12 glass bg-white/5 hover:bg-cyan-400/20 border border-white/10 hover:border-cyan-400/40 rounded-2xl flex items-center justify-center transition-all group scale-100 hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                                    title="Open Global Navigation"
                                >
                                    <Menu size={20} className="text-white group-hover:text-cyan-400" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
