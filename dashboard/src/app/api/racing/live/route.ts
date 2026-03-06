import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('[Proxy] Fetching live events from beta.adstrim.ru');
        const response = await fetch('https://beta.adstrim.ru/api/live', {
            next: { revalidate: 30 }, // Cache for 30 seconds
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`[Proxy] API responded with status ${response.status}`);
            return NextResponse.json({ status: 'error', message: 'API responded with error' }, { status: response.status });
        }

        const data = await response.json();

        // Log category counts for debugging
        if (data.status === 'success' && data.data) {
            const categories = Object.keys(data.data);
            console.log(`[Proxy] Successfully fetched data. Categories: ${categories.join(', ')}`);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Proxy] Error fetching live events:', error);
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}
