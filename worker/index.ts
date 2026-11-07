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
  rawUrl: string;
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

const VIP_PASSCODE = 'bin0sky.tech';
const VIP_WALLHAVEN_KEY = 'MDDrRgAvmbCe7IZdeCnXxW8L06bJW85i';

function randomSeed(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

const CATEGORY_MAP: Record<string, { keywords: string[]; categories: string }> = {
  all: { keywords: [''], categories: '111' },
  nature: { keywords: ['landscape', 'nature', 'mountains', 'aurora', 'ocean', 'forest', 'lake'], categories: '100' },
  scifi: { keywords: ['cyberpunk', 'sci-fi', 'space', 'nebula', 'futuristic', 'galaxy'], categories: '100' },
  anime: { keywords: ['anime', 'manga', 'illustration', 'fantasy'], categories: '010' },
  beauty: { keywords: ['model', 'portrait', 'girl', 'asian', 'beauty'], categories: '001' },
  supercars: { keywords: ['supercar', 'porsche', 'ferrari', 'lamborghini', 'sports car'], categories: '100' },
  cityscape: { keywords: ['cityscape', 'tokyo', 'night city', 'architecture', 'metropolis'], categories: '100' },
  minimalist: { keywords: ['minimalist', 'dark aesthetic', 'oled', 'abstract', 'geometry'], categories: '100' },
};

function getCanonicalReferer(targetHost: string, protocol: string): string {
  const host = targetHost.toLowerCase();
  if (host.includes('wallhaven.cc')) return 'https://wallhaven.cc/';
  if (host.includes('yande.re')) return 'https://yande.re/';
  if (host.includes('konachan.com')) return 'https://konachan.com/';
  if (host.includes('konachan.net')) return 'https://konachan.net/';
  return `${protocol}//${targetHost}/`;
}

function buildStreamProxyUrl(origin: string, rawUrl: string, targetWidth: number, quality: number = 82): string {
  if (targetWidth <= 0) {
    return `${origin}/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  }
  return `${origin}/api/image-proxy?url=${encodeURIComponent(rawUrl)}&w=${targetWidth}&q=${quality}`;
}

async function fetchWallhaven(params: {
  category: string;
  customQuery: string;
  adultMode: boolean;
  purityMode: string;
  apiKey: string;
  origin: string;
  targetWidth: number;
  page: number;
  seed?: string;
}): Promise<UnifiedWallpaper[]> {
  try {
    const { category, customQuery, adultMode, purityMode, apiKey, origin, targetWidth, page, seed } = params;
    const catConfig = CATEGORY_MAP[category] || CATEGORY_MAP.all;

    let queryStr = '';
    if (category === 'custom' && customQuery.trim()) {
      queryStr = customQuery.trim();
    } else if (catConfig.keywords.length > 0 && catConfig.keywords[0] !== '') {
      const idx = Math.max(0, page - 1) % catConfig.keywords.length;
      queryStr = catConfig.keywords[idx];
    }

    let catBitmask = catConfig.categories;
    if (category === 'custom') catBitmask = '111';
    if (adultMode && (category === 'beauty' || category === 'all')) {
      catBitmask = category === 'beauty' ? '001' : '111';
    } else if (adultMode && category === 'anime') {
      catBitmask = '010';
    }

    let purity = '100';
    if (adultMode && apiKey) {
      purity = purityMode || '111';
    }

    const searchUrl = new URL('https://wallhaven.cc/api/v1/search');
    searchUrl.searchParams.set('categories', catBitmask);
    searchUrl.searchParams.set('purity', purity);
    searchUrl.searchParams.set('atleast', '1920x1080');
    searchUrl.searchParams.set('sorting', 'random');
    searchUrl.searchParams.set('seed', seed && seed.trim() ? seed.trim() : randomSeed());
    searchUrl.searchParams.set('page', String(Math.max(1, page)));

    if (queryStr) {
      if (adultMode && purity === '001' && (category === 'beauty' || category === 'anime' || category === 'all')) {
        // Let category bitmask + purity=001 return richest NSFW pool
      } else {
        searchUrl.searchParams.set('q', queryStr);
      }
    }
    if (apiKey && adultMode) {
      searchUrl.searchParams.set('apikey', apiKey);
    }

    let res = await fetch(searchUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        ...(apiKey && adultMode ? { 'X-API-Key': apiKey } : {}),
      },
    });

    let json: any = res.ok ? await res.json() : null;

    // 弹性保底：若特定关键字搜索结果为空，立即降级使用分类掩码全量随机池，确保永远有高质壁纸返回
    if (!json || !Array.isArray(json.data) || json.data.length === 0) {
      if (queryStr) {
        searchUrl.searchParams.delete('q');
        const fallbackRes = await fetch(searchUrl.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            ...(apiKey && adultMode ? { 'X-API-Key': apiKey } : {}),
          },
        });
        if (fallbackRes.ok) {
          const fallbackJson: any = await fallbackRes.json();
          if (fallbackJson && Array.isArray(fallbackJson.data)) {
            json = fallbackJson;
          }
        }
      }
    }

    if (!json || !Array.isArray(json.data)) return [];

    return json.data
      .filter((item: any) => !item.file_size || item.file_size < 16 * 1024 * 1024)
      .slice(0, 18)
      .map((item: any) => {
        const rawUrl = item.path;
        const rawThumb = item.thumbs?.large || item.thumbs?.original || item.thumbs?.small || item.path;
        const w = Number(item.dimension_x) || 3840;
        const h = Number(item.dimension_y) || 2160;

        return {
          id: `wh_${item.id}`,
          title: `Wallhaven · ${(item.category || '4K').toUpperCase()}`,
          category,
          url: buildStreamProxyUrl(origin, rawUrl, targetWidth, 82),
          previewUrl: buildStreamProxyUrl(origin, rawThumb, 640, 75),
          rawUrl: `${origin}/api/image-proxy?url=${encodeURIComponent(rawUrl)}`,
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
  targetWidth: number;
  page: number;
}): Promise<UnifiedWallpaper[]> {
  try {
    const { category, customQuery, adultMode, purityMode, origin, targetWidth, page } = params;
    if (category !== 'anime' && category !== 'all' && category !== 'custom' && !adultMode) {
      return [];
    }

    const tags: string[] = [];
    if (!adultMode) {
      tags.push('rating:s');
    } else if (purityMode === '001') {
      tags.push('rating:e');
    } else if (purityMode === '110') {
      tags.push('rating:q');
    }

    if (category === 'custom' && customQuery.trim()) {
      tags.push(customQuery.trim().replace(/\s+/g, '_').toLowerCase());
    }

    if (tags.length === 0) {
      tags.push('order:random');
      tags.push('width:>=2560');
    }

    const targetPage = page <= 1 ? Math.floor(Math.random() * 25) + 1 : page;
    const url = new URL('https://yande.re/post.json');
    url.searchParams.set('limit', '18');
    url.searchParams.set('page', String(targetPage));
    if (tags.length > 0) {
      url.searchParams.set('tags', tags.join(' '));
    }

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return [];
    const posts: any[] = await res.json();
    if (!Array.isArray(posts)) return [];

    return posts
      .filter((p) => p && (p.sample_url || p.jpeg_url || p.file_url))
      .slice(0, 14)
      .map((p) => {
        const rawStreamSource = p.sample_url || p.jpeg_url || p.file_url;
        const rawOriginal = p.file_url || rawStreamSource;
        const rawPreview = p.preview_url || rawStreamSource;
        const w = Number(p.width) || 2560;
        const h = Number(p.height) || 1440;

        return {
          id: `yd_${p.id}`,
          title: `Yande.re · #${p.id}`,
          category: 'anime',
          url: buildStreamProxyUrl(origin, rawStreamSource, targetWidth, 82),
          previewUrl: buildStreamProxyUrl(origin, rawPreview, 600, 75),
          rawUrl: `${origin}/api/image-proxy?url=${encodeURIComponent(rawOriginal)}`,
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
  targetWidth: number;
  page: number;
}): Promise<UnifiedWallpaper[]> {
  try {
    const { category, adultMode, purityMode, origin, targetWidth, page } = params;
    if (category !== 'anime' && category !== 'all' && !adultMode) {
      return [];
    }

    const domain = adultMode ? 'https://konachan.com/post.json' : 'https://konachan.net/post.json';
    const tags: string[] = [];
    if (!adultMode) {
      tags.push('rating:s');
    } else if (purityMode === '001') {
      tags.push('rating:e');
    } else if (purityMode === '110') {
      tags.push('rating:q');
    }

    if (tags.length === 0) {
      tags.push('order:random');
      tags.push('width:>=2560');
    }

    const targetPage = page <= 1 ? Math.floor(Math.random() * 25) + 1 : page;
    const url = new URL(domain);
    url.searchParams.set('limit', '14');
    url.searchParams.set('page', String(targetPage));
    if (tags.length > 0) {
      url.searchParams.set('tags', tags.join(' '));
    }

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return [];
    const posts: any[] = await res.json();
    if (!Array.isArray(posts)) return [];

    return posts
      .filter((p) => p && (p.sample_url || p.jpeg_url || p.file_url))
      .slice(0, 10)
      .map((p) => {
        const rawStreamSource = p.sample_url || p.jpeg_url || p.file_url;
        const rawOriginal = p.file_url || rawStreamSource;
        const rawPreview = p.preview_url || rawStreamSource;
        const w = Number(p.width) || 2560;
        const h = Number(p.height) || 1440;

        return {
          id: `kc_${p.id}`,
          title: `Konachan · #${p.id}`,
          category: 'anime',
          url: buildStreamProxyUrl(origin, rawStreamSource, targetWidth, 82),
          previewUrl: buildStreamProxyUrl(origin, rawPreview, 600, 75),
          rawUrl: `${origin}/api/image-proxy?url=${encodeURIComponent(rawOriginal)}`,
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
      const reqAdult = url.searchParams.get('adult') === '1' || url.searchParams.get('adult') === 'true';
      const passcodeOrKey = (url.searchParams.get('key') || '').trim();
      const enableYande = url.searchParams.get('yande') !== '0';
      const enableKonachan = url.searchParams.get('konachan') !== '0';
      const targetWidth = Number(url.searchParams.get('w') ?? '2560');
      const page = Number(url.searchParams.get('page') || '1');
      const seed = url.searchParams.get('seed') || '';

      let effectiveApiKey = '';
      let isAuthorized = false;
      if (passcodeOrKey === VIP_PASSCODE) {
        effectiveApiKey = VIP_WALLHAVEN_KEY;
        isAuthorized = true;
      } else if (passcodeOrKey.length >= 16) {
        effectiveApiKey = passcodeOrKey;
        isAuthorized = true;
      }

      // 强安全守卫：只有密码完全正确 (bin0sky.tech) 或配置了有效 Key，才允许启用成人模式
      const adultMode = reqAdult && isAuthorized;
      const purityMode = adultMode ? (url.searchParams.get('purity') || '111') : '100';

      const origin = url.origin;

      const tasks: Promise<UnifiedWallpaper[]>[] = [
        fetchWallhaven({
          category,
          customQuery,
          adultMode,
          purityMode,
          apiKey: effectiveApiKey,
          origin,
          targetWidth,
          page,
          seed,
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
            targetWidth,
            page,
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
            targetWidth,
            page,
          })
        );
      }

      const results = await Promise.all(tasks);
      const merged = results.flat();

      for (let i = merged.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [merged[i], merged[j]] = [merged[j], merged[i]];
      }

      return new Response(
        JSON.stringify({
          ok: true,
          unlockedVip: isAuthorized,
          targetWidth,
          count: merged.length,
          data: merged,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // 2. High-Speed Adaptive WebP Edge Image Proxy
    if (url.pathname === '/api/image-proxy') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl || !targetUrl.startsWith('https://')) {
        return new Response('Invalid target URL', { status: 400, headers: CORS_HEADERS });
      }

      const resizeW = Number(url.searchParams.get('w') || '0');
      const quality = Number(url.searchParams.get('q') || '82');

      try {
        // Strategy A: Dynamic WebP Compression & Resize via Cloudflare-backed wsrv.nl Edge Resizer
        // Cuts 12MB PNG down to ~350KB progressive WebP for 15x faster loading!
        if (resizeW > 0) {
          const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(targetUrl)}&w=${resizeW}&q=${quality}&output=webp&il&we`;
          const fastRes = await fetch(wsrvUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            },
            cf: {
              cacheEverything: true,
              cacheTtl: 604800,
            },
          } as RequestInit);

          if (fastRes.ok) {
            const headers = new Headers(CORS_HEADERS);
            headers.set('Content-Type', fastRes.headers.get('Content-Type') || 'image/webp');
            headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable');
            return new Response(fastRes.body, { status: 200, headers });
          }
        }

        // Strategy B: Fallback to Direct Origin with Canonical Referer + Cloudflare Native Image Resizing
        const parsedTarget = new URL(targetUrl);
        const canonicalReferer = getCanonicalReferer(parsedTarget.host, parsedTarget.protocol);

        const cfOptions: Record<string, any> = {
          cacheEverything: true,
          cacheTtl: 604800,
        };
        if (resizeW > 0) {
          cfOptions.image = {
            width: resizeW,
            quality,
            format: 'webp',
            fit: 'scale-down',
          };
        }

        const imgRes = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            Referer: canonicalReferer,
          },
          cf: cfOptions,
        } as RequestInit);

        if (!imgRes.ok) {
          return new Response(`Upstream error ${imgRes.status}`, { status: imgRes.status, headers: CORS_HEADERS });
        }

        const headers = new Headers(CORS_HEADERS);
        headers.set('Content-Type', imgRes.headers.get('Content-Type') || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable');

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
