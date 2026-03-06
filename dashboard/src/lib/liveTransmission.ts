export interface Channel {
    name: string;
    link: string;
    channel_sources?: string[];
}

export interface GamingEvent {
    id: string;
    home_team: string | null;
    away_team: string | null;
    title?: string;
    sport: string;
    league: string | null;
    timestamp: number;
    channels: Channel[];
    status?: string;
    duration?: number;
}

export interface ApiResponse {
    status: string;
    data: {
        [key: string]: GamingEvent[];
    };
}

const RACING_KEYWORDS = [
    'f1', 'formula 1', 'f2', 'f3', 'motogp', 'moto2', 'moto3',
    'indycar', 'wec', 'sbk', 'superbike', 'nascar', 'imsa',
    'rally', 'dtm', 'formula e', 'motorsport', 'racing', 'grand prix',
    'practice', 'qualifying', 'race', 'paddock', 'le mans', '24h',
    'gt world', 'ferrari challenge', 'porsche cup', 'fia',
    'supercross', 'motocross', 'enduro', 'supercars', 'tcr', 'gt3', 'gt4',
    'extreme e', 'isle of man', 'tt', 'touring car', 'stock car',
    'world rx', 'wrc', 'erc', 'motoe', 'superstock', 'bathurst', 'spa 24',
    'nurburgring', 'monaco', 'silverstone', 'monza', 'daytona', 'sebring'
];

const PREFERRED_LANGUAGES = ['[IT]', '[UK]', '[USA]', '[EN]'];
const PREFERRED_CHANNELS = ['Sky Sport', 'TV8', 'Eurosport', 'TNT Sports', 'ESPN', 'NBC'];

export async function getLiveRacingEvents(): Promise<GamingEvent[]> {
    try {
        // Use our internal proxy to bypass CORS
        const response = await fetch('/api/racing/live', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch from internal proxy');

        const result: ApiResponse = await response.json();
        const racingEvents: GamingEvent[] = [];

        if (result.status === 'success' && result.data) {
            console.log(`[API] Success, found ${Object.keys(result.data).length} sport categories`);
            for (const sportType in result.data) {
                const events = result.data[sportType];
                if (!Array.isArray(events)) continue;

                // Even more aggressive category matching
                const categoryIsRacing = /racing|motorsport|motorcycle|motorcycling|auto|moto|f1|fomula/i.test(sportType);

                events.forEach(event => {
                    const searchString = `${event.home_team || ''} ${event.away_team || ''} ${event.league || ''} ${event.sport || ''} ${event.title || ''}`;
                    const isRacing = categoryIsRacing || RACING_KEYWORDS.some(keyword => {
                        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                        return regex.test(searchString);
                    });

                    if (isRacing) {
                        console.log(`[API] Found racing event in ${sportType}: ${event.title || event.home_team || 'Unnamed Event'}`);
                        // Sort channels to prioritize preferred languages/names
                        const sortedChannels = [...event.channels].sort((a, b) => {
                            const aScore = getChannelScore(a.name);
                            const bScore = getChannelScore(b.name);
                            return bScore - aScore;
                        });

                        racingEvents.push({
                            ...event,
                            channels: sortedChannels
                        });
                    }
                });
            }
        }

        console.log(`[API] Total racing events found: ${racingEvents.length}`);
        return racingEvents;
    } catch (error) {
        console.error('Error fetching live racing events:', error);
        return [];
    }
}

function getChannelScore(name: string): number {
    let score = 0;
    const lowerName = name.toLowerCase();

    if (name.includes('[IT]')) score += 100;
    if (name.includes('[UK]') || name.includes('[USA]') || name.includes('[EN]')) score += 50;

    if (lowerName.includes('sky sport')) score += 30;
    if (lowerName.includes('tv8')) score += 40; // Free to air IT often has F1/MotoGP
    if (lowerName.includes('euro sport')) score += 20;

    return score;
}
