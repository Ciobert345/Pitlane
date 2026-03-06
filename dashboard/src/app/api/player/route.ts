import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://php.adffdafdsafds.sbs/',
};

// SUPER INTERCEPTOR: Hooks into everything to catch the m3u8 link.
const INTERCEPTION_SCRIPT = `
(function() {
    console.log('[SuperInterception] Starting...');

    function notifyParent(url) {
        if (!url || typeof url !== 'string') return;
        if (url.includes('mono.css') || url.includes('.m3u8')) {
            console.log('[SuperInterception] !!! MATCH FOUND:', url);
            window.parent.postMessage({ type: 'M3U8_FOUND', url: url }, '*');
        }
    }

    // 1. Hook fetch
    const originalFetch = window.fetch;
    window.fetch = function(url, init) {
        notifyParent(url);
        return originalFetch.apply(this, arguments);
    };

    // 2. Hook XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        notifyParent(url);
        return originalOpen.apply(this, arguments);
    };

    // 3. Hook Clappr
    const checkClappr = () => {
        if (window.Clappr && window.Clappr.Player) {
            const OriginalPlayer = window.Clappr.Player;
            window.Clappr.Player = function(options) {
                if (options && options.source) notifyParent(options.source);
                const p = new OriginalPlayer(options);
                p.on('play', () => { if (p.options.source) notifyParent(p.options.source); });
                return p;
            };
            Object.assign(window.Clappr.Player, OriginalPlayer);
            console.log('[SuperInterception] Clappr Hooked.');
        } else {
            setTimeout(checkClappr, 100);
        }
    };
    checkClappr();

    // 4. Hook Hls.js
    const checkHls = () => {
        if (window.Hls) {
            const OriginalHls = window.Hls;
            const originalLoad = OriginalHls.prototype.loadSource;
            OriginalHls.prototype.loadSource = function(src) {
                notifyParent(src);
                return originalLoad.apply(this, arguments);
            };
            console.log('[SuperInterception] Hls.js Hooked.');
        } else {
            setTimeout(checkHls, 100);
        }
    };
    checkHls();

    // 5. Video Element SRC observer
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                notifyParent(mutation.target.src);
            }
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'VIDEO' || node.tagName === 'SOURCE') {
                        notifyParent(node.src);
                    }
                });
            }
        });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

})();
`;

const INJECTED_CSS = `
    * { box-sizing: border-box; }
    html, body { 
        margin: 0 !important; 
        padding: 0 !important; 
        background: #000 !important; 
        overflow: hidden !important;
        height: 100% !important;
        width: 100% !important;
    }
    /* Hide UI */
    .navbar, header, nav, .sidebar, .footer { display: none !important; }
`;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const domain = searchParams.get('domain') || 'php.adffdafdsafds.sbs';

    if (!channel) return new NextResponse('Missing channel', { status: 400 });

    const sourceUrl = `https://${domain}/d/sporting77/watch/${channel}`;

    try {
        const res = await fetch(sourceUrl, { headers: BROWSER_HEADERS as HeadersInit, cache: 'no-store' });
        if (!res.ok) return new NextResponse(`Error: ${res.status}`, { status: res.status });

        let html = await res.text();
        html = html.replace(/src="\//g, `src="https://${domain}/`).replace(/href="\//g, `href="https://${domain}/`);

        const headContent = `
            <style>${INJECTED_CSS}</style>
            <script>${INTERCEPTION_SCRIPT}</script>
        `;

        if (html.includes('</head>')) {
            html = html.replace('</head>', `${headContent}</head>`);
        } else {
            html = headContent + html;
        }

        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    } catch (error) {
        return new NextResponse('Proxy Error', { status: 500 });
    }
}
