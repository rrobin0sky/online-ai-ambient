export interface Env {
  ASSETS: {
    fetch: (req: Request) => Promise<Response>;
  };
}

interface UnifiedWallpaper {
  id: string;
  title: string;
  category: string;
  url: string;
  previewUrl: string;
  source: 'Wallhaven' | 'Yande.re' | 'Konachan' | 'Bing' | 'Unsplash';
  location?: string;
  resolution?: string;
  purity?: string;
  aspectRatio?: number;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Built-in VIP credentials unlocked via private passcode "bin0sky.tech"
const VIP_PASSCODE = 'bin0sky.tech';
const VIP_WALLHAVEN_KEY = 'MDDrRgAvmbCe7IZdeCnXxW8L06bJW85i';

function randomSeed(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

const CATEGORY_QUERY_MAP: Record<string, { q: string; categories: string }> = {
  all: { q: '', categories: '111' },
  nature: { q: 'landscape OR mountains OR aurora OR nature OR ocean', categories: '100' },
  scifi: { q: 'cyberpunk OR sci-fi OR nebula OR space OR futuristic', categories: '100' },
  anime: { q: 'anime', categories: '010' },
  beauty: { q: 'model OR portrait OR girl OR women OR asian', categories: '001' },
  supercars: { q: 'supercar OR sports car OR automotive', categories: '100' },
  cityscape: { q: 'cityscape OR night city OR architecture OR tokyo', categories: '100' },
  minimalist: { q: 'minimalist OR dark aesthetic OR oled OR abstract', categories: '100' },
};

function getCanonicalReferer(targetHost: string, protocol: string): string {
  const host = targetHost.toLowerCase();
  if (host.includes('wallhaven.cc')) {
    return 'https://wallhaven.cc/';
  }
  if (host.includes('yande.re')) {
    return 'https://yande.re/';
  }
  if (host.includes('konachan.com')) {
    return 'https://konachan.com/';
  }
  if (host.includes('konachan.net')) {
    return 'https://konachan.net/';
  }
  return `${protocol}//${targetHost}/`;
}

async function fetchWallhaven(params: {
  category: string;
  customQuery: string;
  adultMode: boolean;
  purityMode: string;
  apiKey: string;
  origin: string;
}): Promise<UnifiedWallpaper[]> {
  try {
    const { category, customQuery, adultMode, purityMode, apiKey, origin } = params;
    const preset = CATEGORY_QUERY_MAP[category] || CATEGORY_QUERY_MAP.all;
    const queryStr = category === 'custom' && customQuery.trim() ? customQuery.trim() : preset.q;

    let catBitmask = preset.categories;
    if (category === 'custom') catBitmask = '111';
    if (adultMode && (category === 'beauty' || category === 'all')) {
      catBitmask = category === 'beauty' ? '001' : '111';
    } else if (adultMode && category === 'anime') {
      catBitmask = '010';
    }

    let purity = '100';
    if (adultMode) {
      if (apiKey) {
        purity = purityMode || '111';
      } else {
        purity = '110';
      }
    }

    const searchUrl = new URL('https://wallhaven.cc/api/v1/search');
    searchUrl.searchParams.set('categories', catBitmask);
    searchUrl.searchParams.set('purity', purity);
    searchUrl.searchParams.set('atleast', '1920x1080');
    searchUrl.searchParams.set('sorting', 'random');
    searchUrl.searchParams.set('seed', randomSeed());

    if (queryStr) {
      if (adultMode && purity === '001' && (category === 'beauty' || category === 'anime' || category === 'all')) {
        // Pure NSFW mode: let category bitmask + purity=001 return richest pool
      } else {
        searchUrl.searchParams.set('q', queryStr);
      }
    }
    if (apiKey && adultMode) {
      searchUrl.searchParams.set('apikey', apiKey);
    }

    const res = await fetch(searchUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ...(apiKey && adultMode ? { 'X-API-Key': apiKey } : {}),
      },
    });

    if (!res.ok) return [];
    const json: any = await res.json();
    if (!json || !Array.isArray(json.data)) return [];

    // Filter out ultra-massive > 15MB files to avoid slow loading stalls
    return json.data
      .filter((item: any) => !item.file_size || item.file_size < 16 * 1024 * 1024)
      .slice(0, 15)
      .map((item: any) => {
        const rawUrl = item.path;
        const rawThumb = item.thumbs?.large || item.thumbs?.original || item.thumbs?.small || item.path;
        const proxiedUrl = `${origin}/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
        const proxiedThumb = `${origin}/api/image-proxy?url=${encodeURIComponent(rawThumb)}`;
        const w = Number(item.dimension_x) || 3840;
        const h = Number(item.dimension_y) || 2160;

        return {
          id: `wh_${item.id}`,
          title: `Wallhaven · ${(item.category || '4K').toUpperCase()}`,
          category,
          url: proxiedUrl,
          previewUrl: proxiedThumb,
          source: 'Wallhaven',
          location: `${item.resolution || '4K UHD'} · ${(item.purity || 'sfw').toUpperCase()}`,
          resolution: item.resolution,
          purity: item.purity,
          aspectRatio: w / h,
        };
      });
  } catch {
    return [];
  }
}

async function fetchYande(params: {
  category: string;
  customQuery: string;
  adultMode: boolean;
  purityMode: string;
  origin: string;
}): Promise<UnifiedWallpaper[]> {
  try {
    const { category, customQuery, adultMode, purityMode, origin } = params;
    if (category !== 'anime' && category !== 'all' && category !== 'custom' && !adultMode) {
      return [];
    }

    const tags: string[] = ['order:random', 'width:>=1920'];
    if (!adultMode) {
      tags.push('rating:s');
    } else if (purityMode === '001') {
      tags.push('-rating:s');
    }

    if (category === 'custom' && customQuery.trim()) {
      tags.push(customQuery.trim().replace(/\s+/g, '_').toLowerCase());
    }

    const url = new URL('https://yande.re/post.json');
    url.searchParams.set('limit', '12');
    url.searchParams.set('tags', tags.join(' '));

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    if (!res.ok) return [];
    const posts: any[] = await res.json();
    if (!Array.isArray(posts)) return [];

    return posts
      .filter((p) => p && (p.sample_url || p.jpeg_url || p.file_url))
      .slice(0, 8)
      .map((p) => {
        // Always prefer fast high-res JPEG sample_url/jpeg_url (~1MB) over 35MB raw PNG for smooth streaming
        const rawFull = p.sample_url || p.jpeg_url || p.file_url;
        const rawPreview = p.preview_url || rawFull;
        const w = Number(p.width) || 2560;
        const h = Number(p.height) || 1440;

        return {
          id: `yd_${p.id}`,
          title: `Yande.re · #${p.id}`,
          category: 'anime',
          url: `${origin}/api/image-proxy?url=${encodeURIComponent(rawFull)}`,
          previewUrl: `${origin}/api/image-proxy?url=${encodeURIComponent(rawPreview)}`,
          source: 'Yande.re',
          location: `${w}×${h} · Rating ${(p.rating || 's').toUpperCase()}`,
          resolution: `${w}x${h}`,
          aspectRatio: w / h,
        };
      });
  } catch {
    return [];
  }
}

async function fetchKonachan(params: {
  category: string;
  adultMode: boolean;
  purityMode: string;
  origin: string;
}): Promise<UnifiedWallpaper[]> {
  try {
    const { category, adultMode, purityMode, origin } = params;
    if (category !== 'anime' && category !== 'all' && !adultMode) {
      return [];
    }

    const domain = adultMode ? 'https://konachan.com/post.json' : 'https://konachan.net/post.json';
    const tags: string[] = ['order:random', 'width:>=1920'];
    if (!adultMode) {
      tags.push('rating:s');
    } else if (purityMode === '001') {
      tags.push('-rating:s');
    }

    const url = new URL(domain);
    url.searchParams.set('limit', '8');
    url.searchParams.set('tags', tags.join(' '));

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    if (!res.ok) return [];
    const posts: any[] = await res.json();
    if (!Array.isArray(posts)) return [];

    return posts
      .filter((p) => p && (p.sample_url || p.jpeg_url || p.file_url))
      .slice(0, 6)
      .map((p) => {
        const rawFull = p.sample_url || p.jpeg_url || p.file_url;
        const rawPreview = p.preview_url || rawFull;
        const w = Number(p.width) || 2560;
        const h = Number(p.height) || 1440;

        return {
          id: `kn_${p.id}`,
          title: `Konachan · #${p.id}`,
          category: 'anime',
          url: `${origin}/api/image-proxy?url=${encodeURIComponent(rawFull)}`,
          previewUrl: `${origin}/api/image-proxy?url=${encodeURIComponent(rawPreview)}`,
          source: 'Konachan',
          location: `${w}×${h} · Rating ${(p.rating || 's').toUpperCase()}`,
          resolution: `${w}x${h}`,
          aspectRatio: w / h,
        };
      });
  } catch {
    return [];
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 1. Wallpaper Discovery & Search API
    if (url.pathname === '/api/wallpapers') {
      const category = url.searchParams.get('category') || 'all';
      const customQuery = url.searchParams.get('q') || '';
      const adultMode = url.searchParams.get('adult') === '1' || url.searchParams.get('adult') === 'true';
      const purityMode = url.searchParams.get('purity') || (adultMode ? '111' : '100');
      const passcodeOrKey = (url.searchParams.get('key') || '').trim();
      const enableYande = url.searchParams.get('yande') !== '0';
      const enableKonachan = url.searchParams.get('konachan') !== '0';

      let effectiveApiKey = '';
      let unlockedByPasscode = false;
      if (passcodeOrKey === VIP_PASSCODE) {
        effectiveApiKey = VIP_WALLHAVEN_KEY;
        unlockedByPasscode = true;
      } else if (passcodeOrKey.length >= 16) {
        effectiveApiKey = passcodeOrKey;
      }

      const origin = url.origin;

      const tasks: Promise<UnifiedWallpaper[]>[] = [
        fetchWallhaven({
          category,
          customQuery,
          adultMode,
          purityMode,
          apiKey: effectiveApiKey,
          origin,
        }),
      ];

      if ((adultMode || category === 'anime') && enableYande) {
        tasks.push(
          fetchYande({
            category,
            customQuery,
            adultMode,
            purityMode,
            origin,
          })
        );
      }

      if ((adultMode || category === 'anime') && enableKonachan) {
        tasks.push(
          fetchKonachan({
            category,
            adultMode,
            purityMode,
            origin,
          })
        );
      }

      const results = await Promise.all(tasks);
      const merged = results.flat();

      // Shuffle merged wallpapers
      for (let i = merged.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [merged[i], merged[j]] = [merged[j], merged[i]];
      }

      return new Response(
        JSON.stringify({
          ok: true,
          unlockedVip: unlockedByPasscode,
          count: merged.length,
          data: merged,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // 2. High-Speed Edge Image Proxy with Canonical Referer Spoofing
    if (url.pathname === '/api/image-proxy') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl || !targetUrl.startsWith('https://')) {
        return new Response('Invalid target URL', { status: 400, headers: CORS_HEADERS });
      }

      try {
        const parsedTarget = new URL(targetUrl);
        const canonicalReferer = getCanonicalReferer(parsedTarget.host, parsedTarget.protocol);

        const imgRes = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            Referer: canonicalReferer,
          },
          cf: {
            cacheEverything: true,
            cacheTtl: 604800,
          },
        } as RequestInit);

        if (!imgRes.ok) {
          return new Response(`Upstream error ${imgRes.status}`, { status: imgRes.status, headers: CORS_HEADERS });
        }

        const headers = new Headers(CORS_HEADERS);
        headers.set('Content-Type', imgRes.headers.get('Content-Type') || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');

        return new Response(imgRes.body, {
          status: 200,
          headers,
        });
      } catch (e: any) {
        return new Response(`Proxy error: ${e?.message || 'unknown'}`, { status: 502, headers: CORS_HEADERS });
      }
    }

    // 3. Fallback to static frontend assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
