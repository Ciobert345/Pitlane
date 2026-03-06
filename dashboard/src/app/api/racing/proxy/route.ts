import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://php.adffdafdsafds.sbs/',
    'Origin': 'https://php.adffdafdsafds.sbs',
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) return new NextResponse('Missing URL', { status: 400 });

    try {
        console.log(`[StreamProxy] Fetching: ${url.substring(0, 100)}...`);

        const res = await fetch(url, {
            headers: BROWSER_HEADERS as HeadersInit,
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error(`[StreamProxy] Failed to fetch segment: ${res.status}`);
            return new NextResponse(`Upstream Error: ${res.status}`, { status: res.status });
        }

        const contentType = res.headers.get('Content-Type') || 'application/octet-stream';
        const data = await res.arrayBuffer();

        // If it's a manifest (m3u8 or disguised css), we need to rewrite URLs
        const isManifest = url.includes('.m3u8') ||
            url.includes('.css') ||
            contentType.includes('mpegurl') ||
            contentType.includes('x-mpegurl');

        if (isManifest) {
            const text = new TextDecoder().decode(data);

            // Only rewrite if it looks like an M3U8 (starts with #EXTM3U)
            if (text.startsWith('#EXTM3U')) {
                const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

                // Rewrite URLs (lines that don't start with #)
                const rewritten = text.split('\n').map(line => {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) return line;

                    let fullUrl = trimmed;
                    if (!fullUrl.startsWith('http')) {
                        try {
                            fullUrl = new URL(fullUrl, baseUrl).toString();
                        } catch (e) { return line; }
                    }
                    return `/api/racing/proxy?url=${encodeURIComponent(fullUrl)}`;
                }).join('\n');

                return new NextResponse(rewritten, {
                    headers: {
                        'Content-Type': contentType,
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'no-store',
                    },
                });
            }
        }

        // For binary segments (.ts) or non-manifest manifests, just pipe them through
        return new NextResponse(data, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': res.headers.get('Content-Length') || String(data.byteLength),
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600',
            },
        });

    } catch (error) {
        console.error('[StreamProxy Error]', error);
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}
