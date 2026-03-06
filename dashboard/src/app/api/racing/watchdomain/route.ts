import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('https://beta.adstrim.ru/api/watchdomain', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json',
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!response.ok) {
            return NextResponse.json({ status: 'error', message: 'Failed to fetch watch domain' }, { status: response.status });
        }

        const data = await response.json();
        console.log('[WatchDomain Proxy] Result:', data);
        return NextResponse.json(data);
    } catch (error) {
        console.error('[WatchDomain Proxy] Error:', error);
        // Return the last known working domain as fallback
        return NextResponse.json({ status: 'success', domain: 'php.adffdafdsafds.sbs', d: 'adffdafdsafds.sbs' });
    }
}
