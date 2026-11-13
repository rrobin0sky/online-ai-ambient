interface Env {
  ASSETS: {
    fetch: (req: Request) => Promise<Response>;
  };
  AMBIENT_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string) => Promise<void>;
  };
  VIP_PASSCODE?: string;
  VIP_WALLHAVEN_KEY?: string;
}

interface SsoAuthResult {
  authenticated: boolean;
  hasVipScope: boolean;
  uid?: string;
  username?: string;
  role?: string;
  scopes: string[];
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
  tags?: string[];
  dateAdded?: number;
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowed =
    origin === 'https://bin0sky.tech' ||
    /^https:\/\/[a-z0-9-]+\.bin0sky\.tech$/i.test(origin) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Passcode',
  };
  if (allowed) {
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  }
  return headers;
}

async function verifySsoAuth(request: Request): Promise<SsoAuthResult> {
  const cookie = request.headers.get('Cookie') || '';
  const auth = request.headers.get('Authorization') || '';
  if (!cookie.includes('b0_token=') && !auth.toLowerCase().startsWith('bearer ')) {
    return { authenticated: false, hasVipScope: false, scopes: [] };
  }
  try {
    const headers: Record<string, string> = {};
    if (cookie) headers['Cookie'] = cookie;
    if (auth) headers['Authorization'] = auth;
    const res = await fetch('https://bin0sky.tech/api/auth/me', { headers });
    if (!res.ok) return { authenticated: false, hasVipScope: false, scopes: [] };
    const data = (await res.json()) as any;
    if (!data || !data.authenticated) return { authenticated: false, hasVipScope: false, scopes: [] };
    const role = data.role || data.user?.role || 'user';
    const scopes: string[] = Array.isArray(data.scopes)
      ? data.scopes
      : Array.isArray(data.user?.scopes)
      ? data.user.scopes
      : [];
    const hasVipScope = role === 'admin' || scopes.includes('ambient:vip');
    return {
      authenticated: true,
      hasVipScope,
      uid: data.uid || data.user?.uid,
      username: data.username || data.user?.username,
      role,
      scopes,
    };
  } catch {
    return { authenticated: false, hasVipScope: false, scopes: [] };
  }
}

const DEFAULT_WALLHAVEN_KEY = 'MDDrRgAvmbCe7IZdeCnXxW8L06bJW85i';
const KV_SYNC_KEY = 'admin_sync_v1';

function randomSeed(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

const CATEGORY_MAP: Record<string, { keywords: string[]; categories: string }> = {
  all: { keywords: ['4k wallpaper', 'ultra hd', 'landscape', 'cyberpunk', 'nature', 'cityscape', 'minimalist', 'supercar'], categories: '111' },
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
    if ((category === 'custom' || category === 'recommend') && customQuery.trim()) {
      const candidates = customQuery.split(',').map((s) => s.trim()).filter(Boolean);
      queryStr = candidates[(Math.max(1, page) - 1) % candidates.length] || customQuery.trim();
    } else if (catConfig.keywords.length > 0 && catConfig.keywords[0] !== '') {
      const idx = Math.max(0, page - 1) % catConfig.keywords.length;
      queryStr = catConfig.keywords[idx];
    }

    let catBitmask = catConfig.categories;
    if (category === 'custom' || category === 'recommend') catBitmask = '111';
    if (adultMode && (category === 'beauty' || category === 'all' || category === 'recommend')) {
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
    const finalApiKey = (apiKey && adultMode) ? apiKey : DEFAULT_WALLHAVEN_KEY;
    if (finalApiKey) {
      searchUrl.searchParams.set('apikey', finalApiKey);
    }

    let res = await fetch(searchUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        ...(finalApiKey ? { 'X-API-Key': finalApiKey } : {}),
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
          tags: [item.category || 'general', ...(queryStr ? queryStr.split(/\s+/) : [])].filter(Boolean),
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
    if (category !== 'anime' && category !== 'all' && category !== 'custom' && category !== 'recommend' && !adultMode) {
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
        const parsedTags = typeof p.tags === 'string'
          ? p.tags.split(/\s+/).map((t: string) => t.replace(/_/g, ' ')).filter(Boolean).slice(0, 20)
          : ['anime'];

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
          tags: parsedTags,
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
    if (category !== 'anime' && category !== 'all' && category !== 'recommend' && !adultMode) {
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
        const parsedTags = typeof p.tags === 'string'
          ? p.tags.split(/\s+/).map((t: string) => t.replace(/_/g, ' ')).filter(Boolean).slice(0, 20)
          : ['anime'];

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
          tags: parsedTags,
        };
      });
  } catch {
    return [];
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const CORS_HEADERS = getCorsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const vipPasscode = (env.VIP_PASSCODE || '').trim();
    const vipWallhavenKey = (env.VIP_WALLHAVEN_KEY || DEFAULT_WALLHAVEN_KEY).trim();

    // 0-a. VIP / Adult Mode Passcode Verification (distinguishes VIP unlock from normal user cloud sync)
    if (url.pathname === '/api/vip/verify') {
      const headerKey = (request.headers.get('X-Admin-Passcode') || '').trim();
      const queryKey = (url.searchParams.get('key') || '').trim();
      const passcode = headerKey || queryKey;

      const sso = await verifySsoAuth(request);
      const isPasscodeAuthorized = Boolean(vipPasscode && passcode && passcode === vipPasscode);
      const vipAuthorized = sso.hasVipScope || isPasscodeAuthorized;

      return new Response(
        JSON.stringify({
          ok: vipAuthorized,
          vipAuthorized,
          passcodeValid: isPasscodeAuthorized,
          hasVipScope: sso.hasVipScope,
          authenticated: sso.authenticated,
        }),
        {
          status: vipAuthorized ? 200 : 401,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // 0-b. Favorites & Custom Keywords Cloud Sync API (All authenticated SSO users get isolated sync + VIP_PASSCODE)
    if (url.pathname === '/api/sync') {
      const headerKey = (request.headers.get('X-Admin-Passcode') || '').trim();
      const queryKey = (url.searchParams.get('key') || '').trim();
      const passcode = headerKey || queryKey;

      const sso = await verifySsoAuth(request);
      const isPasscodeAuthorized = Boolean(vipPasscode && passcode && passcode === vipPasscode);

      if (!sso.authenticated && !isPasscodeAuthorized) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Unauthorized: requires BinOS login or valid VIP passcode' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
          }
        );
      }

      const syncKvKey =
        sso.authenticated && sso.uid && sso.role !== 'admin' ? `ambient_sync:${sso.uid}` : KV_SYNC_KEY;

      if (!env.AMBIENT_KV) {
        return new Response(JSON.stringify({ ok: false, error: 'KV not bound' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
        });
      }

      if (request.method === 'GET') {
        const raw = await env.AMBIENT_KV.get(syncKvKey);
        const parsed = raw
          ? JSON.parse(raw)
          : { favorites: [], deletedFavoriteIds: [], customKeywords: [], updatedAt: Date.now() };
        return new Response(JSON.stringify({ ok: true, data: parsed }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            ...CORS_HEADERS,
          },
        });
      }

      if (request.method === 'POST') {
        try {
          const incoming = (await request.json()) as {
            favorites?: UnifiedWallpaper[];
            deletedFavoriteIds?: string[];
            customKeywords?: string[];
            replaceAll?: boolean;
          };

          const existingRaw = await env.AMBIENT_KV.get(syncKvKey);
          const existing = existingRaw
            ? JSON.parse(existingRaw)
            : { favorites: [], deletedFavoriteIds: [], customKeywords: [], updatedAt: 0 };

          if (incoming.replaceAll) {
            const payload = {
              favorites: Array.isArray(incoming.favorites) ? incoming.favorites : [],
              deletedFavoriteIds: Array.isArray(incoming.deletedFavoriteIds) ? incoming.deletedFavoriteIds : [],
              customKeywords: Array.isArray(incoming.customKeywords)
                ? incoming.customKeywords
                : existing.customKeywords || [],
              updatedAt: Date.now(),
            };
            await env.AMBIENT_KV.put(syncKvKey, JSON.stringify(payload));
            return new Response(JSON.stringify({ ok: true, data: payload }), {
              status: 200,
              headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
            });
          }

          // Smart Tombstone-Aware Merge
          const deletedSet = new Set<string>([
            ...(Array.isArray(existing.deletedFavoriteIds) ? existing.deletedFavoriteIds : []),
            ...(Array.isArray(incoming.deletedFavoriteIds) ? incoming.deletedFavoriteIds : []),
          ]);

          const incomingFavs = Array.isArray(incoming.favorites) ? incoming.favorites : [];
          // If an item is explicitly in incoming.favorites, un-tombstone it if recently added
          const incomingIds = new Set(incomingFavs.map((f) => f.id));

          const mergedFavs: UnifiedWallpaper[] = [];
          const seenIds = new Set<string>();

          for (const item of [...incomingFavs, ...(Array.isArray(existing.favorites) ? existing.favorites : [])]) {
            if (!item || !item.id || seenIds.has(item.id)) continue;
            if (deletedSet.has(item.id) && !incomingIds.has(item.id)) continue;
            if (Array.isArray(incoming.deletedFavoriteIds) && incoming.deletedFavoriteIds.includes(item.id)) {
              continue;
            }
            seenIds.add(item.id);
            mergedFavs.push(item);
          }

          const mergedKeywords = Array.isArray(incoming.customKeywords)
            ? incoming.customKeywords
            : existing.customKeywords || [];

          const payload = {
            favorites: mergedFavs,
            deletedFavoriteIds: Array.from(deletedSet).slice(-500),
            customKeywords: mergedKeywords,
            updatedAt: Date.now(),
          };

          await env.AMBIENT_KV.put(syncKvKey, JSON.stringify(payload));
          return new Response(JSON.stringify({ ok: true, data: payload }), {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ ok: false, error: err?.message || 'Sync failed' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
          });
        }
      }
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
      const sso = reqAdult ? await verifySsoAuth(request) : { authenticated: false, hasVipScope: false, scopes: [] };
      if (sso.hasVipScope || (vipPasscode && passcodeOrKey === vipPasscode)) {
        effectiveApiKey = vipWallhavenKey;
        isAuthorized = true;
      }

      // 强安全守卫：只有 SSO (admin / ambient:vip) 或精确匹配环境变量 VIP_PASSCODE，才允许启用成人模式
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

      if ((adultMode || category === 'anime' || category === 'all' || category === 'recommend') && enableYande) {
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

      if ((adultMode || category === 'anime' || category === 'all' || category === 'recommend') && enableKonachan) {
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

    // 3. Cross-Origin API Proxy for Native Clients (Bypasses GFW for Wallhaven, Yande, Konachan API)
    if (url.pathname === '/api/proxy') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl || !targetUrl.startsWith('https://')) {
        return new Response('Invalid target URL', { status: 400, headers: CORS_HEADERS });
      }

      try {
        const parsedTarget = new URL(targetUrl);
        const canonicalReferer = getCanonicalReferer(parsedTarget.host, parsedTarget.protocol);

        const upstreamHeaders: Record<string, string> = {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Referer: canonicalReferer,
          Accept: 'application/json, text/plain, */*',
        };

        const authHeader = request.headers.get('X-API-Key');
        if (authHeader) {
          upstreamHeaders['X-API-Key'] = authHeader;
        }

        const apiRes = await fetch(targetUrl, {
          method: request.method,
          headers: upstreamHeaders,
        });

        const headers = new Headers(CORS_HEADERS);
        headers.set('Content-Type', apiRes.headers.get('Content-Type') || 'application/json; charset=utf-8');
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

        return new Response(apiRes.body, {
          status: apiRes.status,
          headers,
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message || 'Proxy error' }), {
          status: 502,
          headers: CORS_HEADERS,
        });
      }
    }

    // 4. Fallback to static frontend assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
