import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
};

function execAll(regex: RegExp, text: string): string[] {
    const results: string[] = [];
    let match: RegExpExecArray | null;
    // Clone the regex to reset lastIndex each call
    const r = new RegExp(regex.source, regex.flags);
    while ((match = r.exec(text)) !== null) {
        results.push(match[1] ?? match[0]);
        if (!r.global) break;
    }
    return results;
}

function extractM3u8(html: string): string[] {
    const found = new Set<string>();

    // Pattern 1: direct m3u8 URLs
    for (const url of execAll(/https?:\/\/[^\s"'<>\\]+\.m3u8(?:\?[^\s"'<>\\]*)?/g, html)) {
        found.add(url);
    }

    // Pattern 2: JS object fields
    const jsPatterns = [
        /(?:src|source|file|url|stream|hls)\s*[=:]\s*["'`]([^"'`]+\.m3u8[^"'`]*)/gi,
        /["']([^"']*\.m3u8[^"']*)["']/g,
    ];
    for (const pattern of jsPatterns) {
        for (const url of execAll(pattern, html)) {
            if (url.startsWith('http')) found.add(url);
        }
    }

    // Pattern 3: escaped unicode slashes
    const decoded = html
        .replace(/\\u002F/gi, '/')
        .replace(/\\u003A/gi, ':')
        .replace(/\\\//g, '/');

    for (const url of execAll(/https?:\/\/[^\s"'<>\\]+\.m3u8(?:\?[^\s"'<>\\]*)?/g, decoded)) {
        found.add(url);
    }

    const urls = Array.from(found);
    return urls.sort((a, b) => {
        const q = (u: string) => {
            if (u.includes('4k')) return 5;
            if (u.includes('1080')) return 4;
            if (u.includes('720')) return 3;
            if (u.includes('480')) return 2;
            return 1;
        };
        return q(b) - q(a);
    });
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const domain = searchParams.get('domain') || 'php.adffdafdsafds.sbs';

    if (!channel) {
        return NextResponse.json({ error: 'channel required' }, { status: 400 });
    }

    const pageUrl = `https://${domain}/d/sporting77/watch/${channel}`;

    try {
        console.log(`[Stream] Fetching: ${pageUrl}`);
        const pageRes = await fetch(pageUrl, { headers: BROWSER_HEADERS as HeadersInit, cache: 'no-store' });

        if (!pageRes.ok) {
            return NextResponse.json({ status: 'fallback', iframe_url: pageUrl });
        }

        const html = await pageRes.text();
        const m3u8Urls = extractM3u8(html);

        if (m3u8Urls.length > 0) {
            console.log(`[Stream] Found HLS URL: ${m3u8Urls[0]}`);
            return NextResponse.json({ status: 'success', stream_url: m3u8Urls[0], all_urls: m3u8Urls });
        }

        // Try external scripts
        const scriptPattern = /<script[^>]+src=["']([^"']+)["']/g;
        const scriptSrcs = execAll(scriptPattern, html).slice(0, 5);

        for (const scriptSrc of scriptSrcs) {
            try {
                const scriptUrl = scriptSrc.startsWith('http') ? scriptSrc : `https://${domain}${scriptSrc}`;
                const scriptRes = await fetch(scriptUrl, { headers: BROWSER_HEADERS as HeadersInit, cache: 'no-store' });
                if (!scriptRes.ok) continue;
                const scriptUrls = extractM3u8(await scriptRes.text());
                if (scriptUrls.length > 0) {
                    return NextResponse.json({ status: 'success', stream_url: scriptUrls[0], all_urls: scriptUrls });
                }
            } catch { /* ignore */ }
        }

        return NextResponse.json({ status: 'fallback', iframe_url: pageUrl });
    } catch (error) {
        console.error('[Stream] Error:', error);
        return NextResponse.json({ status: 'fallback', iframe_url: pageUrl });
    }
}
