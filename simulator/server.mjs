/**
 * F1 Live Timing Simulator v7 (FINAL - ROBUST ALIGNMENT)
 * =====================================================
 * This version uses a segment-based positioning strategy to guarantee
 * perfect alignment with the dashboard's track map.
 *
 * MECHANICS:
 * 1. REMOVES PositionZ: Forces the dashboard to use the 'getDriverPosition' logic.
 * 2. HI-RES SEGMENTS: Updates 75 segments per driver based on track progress.
 * 3. DYNAMIC TIMING: Significant lap time variance (2-4s) and sector colors.
 * 4. TELEMETRY: Still sends CarDataZ for vibrant speed/RPM indicators.
 */
/*
import http from "http";
import zlib from "zlib";

const PORT = 4005;

// ─── 2025 F1 Grid ────────────────────────────────────────────────────────────
const DRIVERS = [
    { RacingNumber: "1", Tla: "VER", TeamColour: "3671C6" },
    { RacingNumber: "11", Tla: "PER", TeamColour: "3671C6" },
    { RacingNumber: "44", Tla: "HAM", TeamColour: "27F4D2" },
    { RacingNumber: "63", Tla: "RUS", TeamColour: "27F4D2" },
    { RacingNumber: "16", Tla: "LEC", TeamColour: "E8002D" },
    { RacingNumber: "55", Tla: "SAI", TeamColour: "E8002D" },
    { RacingNumber: "4", Tla: "NOR", TeamColour: "FF8000" },
    { RacingNumber: "81", Tla: "PIA", TeamColour: "FF8000" },
    { RacingNumber: "14", Tla: "ALO", TeamColour: "229971" },
    { RacingNumber: "18", Tla: "STR", TeamColour: "229971" },
    { RacingNumber: "31", Tla: "OCO", TeamColour: "FF87BC" },
    { RacingNumber: "10", Tla: "GAS", TeamColour: "FF87BC" },
    { RacingNumber: "23", Tla: "ALB", TeamColour: "64C4FF" },
    { RacingNumber: "2", Tla: "SAR", TeamColour: "64C4FF" },
    { RacingNumber: "77", Tla: "BOT", TeamColour: "52E252" },
    { RacingNumber: "24", Tla: "ZHO", TeamColour: "52E252" },
    { RacingNumber: "20", Tla: "MAG", TeamColour: "B6BABD" },
    { RacingNumber: "27", Tla: "HUL", TeamColour: "B6BABD" },
    { RacingNumber: "3", Tla: "RIC", TeamColour: "6692FF" },
    { RacingNumber: "22", Tla: "TSU", TeamColour: "6692FF" },
];

let tick = 0;
let sessionLap = 25;
let clients = [];

const driverState = DRIVERS.map((d, i) => ({
    ...d,
    progress: 1 - (i / DRIVERS.length) * 0.9,
    speed: 280,
    gear: 7,
    throttle: 90,
    brake: 0,
    drs: 0,
    rpm: 10500,
    lastLap: "1:32.450",
    lastLapMs: 92450,
    gap: i === 0 ? "LEADER" : `+${(i * 1.8).toFixed(3)}`,
    interval: i === 0 ? "LEADER" : `+1.800`,
    lapCount: 25,
    position: i + 1,
}));

function buildDriverList() {
    const list = {};
    for (const d of DRIVERS) {
        list[d.RacingNumber] = {
            RacingNumber: d.RacingNumber, BroadcastName: d.Tla, FullName: d.Tla, Tla: d.Tla,
            Line: DRIVERS.indexOf(d) + 1, TeamName: "F1 Team", TeamColour: d.TeamColour,
            FirstName: d.Tla, LastName: "", Reference: d.Tla, CountryCode: "BHR", HeadshotUrl: "",
        };
    }
    return list;
}

function buildSectors(d) {
    const progress = d.progress;
    return [0, 1, 2].map((s) => {
        const isCompleted = progress > (s + 1) / 3;
        const isCurrent = progress > s / 3 && progress <= (s + 1) / 3;

        // Status 2048 = Completed, 1 = Current
        let status = 0;
        if (isCompleted) status = 2048;
        else if (isCurrent) status = 1;

        let val = "";
        if (isCompleted) val = (29.2 + Math.random() * 1.5).toFixed(3);

        return {
            Stopped: false,
            Value: val,
            Status: status,
            OverallFastest: isCompleted && d.position === 1,
            PersonalFastest: isCompleted && d.position < 5,
            Segments: Array.from({ length: 25 }, (_, seg) => {
                const segProgress = (s / 3) + (seg / 75);
                let segStatus = 0;
                if (progress > segProgress + (1 / 75)) segStatus = 2048; // Fully past
                else if (progress > segProgress) segStatus = 1; // Currently in
                return { Status: segStatus };
            }),
        };
    });
}

function buildTimingData() {
    const lines = {};
    for (const d of driverState) {
        lines[d.RacingNumber] = {
            RacingNumber: d.RacingNumber, Line: d.position, Position: String(d.position),
            ShowPosition: true, GapToLeader: d.gap,
            IntervalToPositionAhead: d.position === 1 ? undefined : { Value: d.interval, Catching: Math.random() > 0.5 },
            LastLapTime: { Value: d.lastLap, Status: 2048, OverallFastest: d.position === 1, PersonalFastest: d.position < 3 },
            BestLapTime: { Value: d.lastLap, Position: d.position },
            NumberOfLaps: d.lapCount, Retired: false, InPit: false, PitOut: false, Stopped: false, Status: 1,
            Sectors: buildSectors(d),
            Speeds: {
                I1: { Value: "270", Status: 2048 }, I2: { Value: "285", Status: 2048 },
                Fl: { Value: "290", Status: 2048 }, St: { Value: "315", Status: 2048 },
            },
        };
    }
    return { Lines: lines, Withheld: false };
}

function deflateRawSync(data) {
    const json = JSON.stringify(data);
    return zlib.deflateRawSync(Buffer.from(json)).toString("base64");
}

function advanceSim() {
    tick++;
    for (let i = 0; i < driverState.length; i++) {
        const d = driverState[i];
        const oldProgress = d.progress;

        // Variance in speed (simulates 1:29 to 1:35 lap times)
        const factor = 0.0011 + (Math.random() * 0.0003);
        d.progress = (d.progress + factor) % 1;

        if (d.progress < oldProgress) {
            d.lapCount++;
            if (i === 0) sessionLap = d.lapCount;

            // Large variance in lap times for visibility
            const baseMs = 90000 + (i * 200);
            const varMs = Math.random() * 5000; // 5s variance
            const lapMs = baseMs + varMs;
            const mins = Math.floor(lapMs / 60000);
            const secs = ((lapMs % 60000) / 1000).toFixed(3);
            d.lastLap = `${mins}:${secs.padStart(6, '0')}`;
            console.log(`[Sim] ${d.Tla} finished lap ${d.lapCount} in ${d.lastLap}`);
        }

        // Telemetry noise for "vibrancy"
        d.speed = 230 + Math.sin(tick * 0.1 + i) * 60 + (Math.random() * 30);
        d.rpm = 9000 + (d.speed - 200) * 100 + (Math.random() * 500);
        d.gear = Math.max(1, Math.min(8, Math.floor(d.speed / 38) + 1));
        d.throttle = d.speed > 250 ? 100 : Math.max(0, 40 + (Math.random() - 0.5) * 60);
        d.brake = d.speed < 190 ? 1 : 0;
        d.drs = (d.speed > 310) ? 12 : 0;

        // Gaps
        if (i > 0) {
            let diff = driverState[0].progress - d.progress;
            if (diff < 0) diff += 1;
            d.gap = `+${(diff * 92).toFixed(3)}`;
            let intDiff = driverState[i - 1].progress - d.progress;
            if (intDiff < 0) intDiff += 1;
            d.interval = `+${(intDiff * 92).toFixed(3)}`;
        }
    }
}

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    if (req.url === "/api/realtime") {
        res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" });

        // CRASH PREVENTION: Populate ALL drivers
        const initCars = {};
        for (const d of DRIVERS) {
            initCars[d.RacingNumber] = { Channels: { "0": 10000, "2": 0, "3": 1, "4": 0, "5": 0, "45": 0 } };
        }

        const initial = {
            SessionInfo: {
                Meeting: { Key: 1229, Name: "Bahrain GP", OfficialName: "Bahrain 2024", Location: "Sakhir", Country: { Code: "BHR", Name: "Bahrain" }, Circuit: { Key: 63, ShortName: "Bahrain" } },
                SessionStatus: { Status: "Started" }, LapCount: { CurrentLap: sessionLap, TotalLaps: 57 },
                WeatherData: { AirTemp: "28.4", Humidity: "54", Pressure: "1011.9", Rainfall: "0", TrackTemp: "38.2" },
                ExtrapolatedClock: { Utc: new Date().toISOString(), Remaining: "01:12:30", Extrapolating: true },
                DriverList: buildDriverList(), TimingData: buildTimingData(),
                CarDataZ: deflateRawSync({ Entries: [{ Utc: new Date().toISOString(), Cars: initCars }] })
            };
            res.write(`event: initial\ndata: ${JSON.stringify(initial)}\n\n`);
            clients.push(res);
            req.on("close", () => clients = clients.filter(c => c !== res));
            return;
        }
        res.writeHead(404); res.end();
    });

setInterval(() => {
    if (clients.length === 0) return;
    advanceSim();

    const cars = {};
    for (const d of driverState) {
        cars[d.RacingNumber] = { Channels: { "0": Math.floor(d.rpm), "2": Math.floor(d.speed), "3": d.gear, "4": Math.floor(d.throttle), "5": d.brake, "45": d.drs } };
    }

    const update = {
        TimingData: buildTimingData(),
        LapCount: { CurrentLap: sessionLap, TotalLaps: 57 },
        CarDataZ: deflateRawSync({ Entries: [{ Utc: new Date().toISOString(), Cars: cars }] })
    };
    const msg = `event: update\ndata: ${JSON.stringify(update)}\n\n`;
    for (const client of clients) client.write(msg);
}, 100);

server.listen(PORT, () => console.log(`🏎️ F1 Sim V7 (ZERO-ALIGNMENT) on http://localhost:${PORT}`));
*/


//Non finito, attualmente disabilitata.