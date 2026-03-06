import { NextResponse } from 'next/server';

// Fetches available racing channels from Sporting77 API
export async function GET() {
    try {
        const response = await fetch('https://beta.adstrim.ru/api/channels', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json',
            },
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            return NextResponse.json({ status: 'error' }, { status: response.status });
        }

        const data = await response.json();
        console.log('[Channels Proxy] Fetched channels:', typeof data);
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Channels Proxy] Error:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to fetch channels' }, { status: 500 });
    }
}
