import { ApiService } from './api';
import { StorageService } from './storage';
import { API_CONFIG } from './config';
import slugify from 'slugify';

export type PackageListItem = {
  _id?: string;
  slug: string;
  title: string;
  description?: string;
  details?: string;
  durationDays: number;
  duration?: { value: number; unit: 'days' | 'hours' | 'minutes' };
  locations?: string[];
  tags?: string[];
  images?: string[];
  coverImage?: string;
  includes?: string[];
  excludes?: string[];
  highlights?: string[];
  requirements?: string[];
  pricing?: { currency?: string; amount: number; perPerson?: boolean };
  isActive?: boolean;
  itinerary?: { day: number; title: string; description?: string }[];
  policies?: { meetingPoint?: string; text?: string; freeCancellation?: boolean; freeCancellationWindow?: 'anytime' | '1_day_before' | '7_days_before' | '14_days_before' };
  maxGroupSize?: number;
  guideId?: string;
  createdAt?: string;
};

export type ListPackagesResponse = {
  success: boolean;
  data: PackageListItem[];
  pagination?: { page: number; limit: number; total: number; pages: number };
};

export type PackageDetailResponse = { success: boolean; data: PackageListItem };

export const GuideService = {
  async getCurrentGuideId(): Promise<string | null> {
    try {
      const user = await StorageService.getUserData();
      const userId = user?.id || user?._id;
      if (!userId) return null;
      const accessToken = await StorageService.getAccessToken();
      const authHeaders = {
        'Accept': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      } as Record<string, string>;

      // 1) Try by userId (if backend expects ObjectId and provided userId is not, backend may return 404)
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/guide/guide/get?userId=${encodeURIComponent(userId)}`, {
          headers: authHeaders,
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?._id) return json.data._id;
        }
      } catch {}

      // 2) Fallbacks by username: raw and slugified
      const username = user?.username as string | undefined;
      if (username) {
        const candidates = [username, slugify(username, { lower: true, strict: true })];
        for (const candidate of candidates) {
          try {
            const res = await fetch(`${API_CONFIG.BASE_URL}/api/guide/guide/get/${encodeURIComponent(candidate)}`, {
              headers: authHeaders,
            });
            if (res.ok) {
              const json = await res.json();
              if (json?.data?._id) return json.data._id;
            }
          } catch {}
        }

        // 3) Final attempt: search list by q=username and take first
        try {
          const res = await fetch(`${API_CONFIG.BASE_URL}/api/guide/guide/list?q=${encodeURIComponent(username)}&limit=1`, {
            headers: authHeaders,
          });
          if (res.ok) {
            const json = await res.json();
            const first = json?.data?.[0];
            if (first?._id) return first._id;
          }
        } catch {}
      }
      return null;
    } catch {
      return null;
    }
  },
  async getGuide(idOrUsername: string): Promise<any | null> {
    try {
      // Try direct (may be id or exact username)
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/guide/guide/get/${encodeURIComponent(idOrUsername)}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) return await res.json();
      } catch {}

      // Try slugified username
      const slug = slugify(idOrUsername, { lower: true, strict: true });
      if (slug && slug !== idOrUsername) {
        try {
          const res2 = await fetch(`${API_CONFIG.BASE_URL}/api/guide/guide/get/${encodeURIComponent(slug)}`, {
            headers: { 'Accept': 'application/json' },
          });
          if (res2.ok) return await res2.json();
        } catch {}
      }

      // Fallback: list search
      try {
        const res3 = await fetch(`${API_CONFIG.BASE_URL}/api/guide/guide/list?q=${encodeURIComponent(idOrUsername)}&limit=1`, {
          headers: { 'Accept': 'application/json' },
        });
        if (res3.ok) {
          const json = await res3.json();
          if (json?.data?.[0]) return { success: true, data: json.data[0] };
        }
      } catch {}
      return null;
    } catch {
      return null;
    }
  },
  async listPackages(params: { page?: number; limit?: number; q?: string; guideId?: string; isActive?: boolean; tags?: string | string[] } = {}): Promise<ListPackagesResponse> {
    const usp = new URLSearchParams();
    if (params.page) usp.set('page', String(params.page));
    if (params.limit) usp.set('limit', String(params.limit));
    if (params.q) usp.set('q', params.q);
    if (params.guideId) usp.set('guideId', params.guideId);
    if (typeof params.isActive === 'boolean') usp.set('isActive', String(params.isActive));
    if (params.tags) {
      const tags = Array.isArray(params.tags) ? params.tags : [params.tags];
      tags.forEach((t) => usp.append('tags', t));
    }
    const qs = usp.toString() ? `?${usp.toString()}` : '';
    return ApiService.get<ListPackagesResponse>(`/api/guide/tourpackages/list${qs}`);
  },

  async getPackage(slugOrId: string): Promise<PackageDetailResponse> {
    return ApiService.get<PackageDetailResponse>(`/api/guide/tourpackages/get/${encodeURIComponent(slugOrId)}`);
  },

  async insertPackage(payload: any): Promise<PackageDetailResponse> {
    const providedGuideId = payload?.guideId;
    const guideId = providedGuideId || await this.getCurrentGuideId();
    if (!guideId) {
      throw new Error('Your guide profile is not ready yet. Please try again after your account is approved.');
    }
    const sanitizeList = (arr?: string[]) => Array.isArray(arr) ? arr.filter((s) => typeof s === 'string' && s.trim()) : [];
    const normalized = {
      guideId,
      slug: payload.slug || slugify(payload.title || payload.name || '', { lower: true, strict: true }),
      title: payload.title || payload.name,
      description: payload.description,
      details: payload.details,
      durationDays: payload.durationDays || payload.duration,
      locations: payload.locations || [],
      tags: payload.tags || [],
      images: payload.images || [],
      coverImage: payload.coverImage,
      includes: sanitizeList(payload.includes || payload.included),
      excludes: sanitizeList(payload.excludes || payload.excluded),
      highlights: sanitizeList(payload.highlights),
      requirements: sanitizeList(payload.requirements),
      pricing: payload.pricing || { amount: payload.price, currency: (payload.currency || 'LKR'), perPerson: !!payload.perPerson },
      maxGroupSize: payload.maxGroupSize || undefined,
      duration: payload.duration || undefined,
      itinerary: payload.itinerary || [],
      policies: payload.policies,
      isActive: typeof payload.isActive === 'boolean' ? payload.isActive : true,
    };
    return ApiService.post<PackageDetailResponse>(`/api/guide/tourpackages/insert`, normalized);
  },

  async updatePackage(slugOrId: string, payload: any): Promise<PackageDetailResponse> {
    // Allow flexible payload; server handles partials
    const normalized = { ...payload };
    if (payload?.title && !payload.slug) {
      normalized.slug = slugify(payload.title, { lower: true, strict: true });
    }
    if (payload?.name && !payload.title) {
      normalized.title = payload.name;
    }
    if (payload?.duration && !payload.durationDays) {
      normalized.durationDays = payload.duration;
    }
    const sanitizeList = (arr?: string[]) => Array.isArray(arr) ? arr.filter((s) => typeof s === 'string' && s.trim()) : [];
    if (payload?.included && !payload.includes) {
      normalized.includes = sanitizeList(payload.included);
    }
    if (payload?.excluded && !payload.excludes) {
      normalized.excludes = sanitizeList(payload.excluded);
    }
    if (payload?.highlights) {
      normalized.highlights = sanitizeList(payload.highlights);
    }
    if (payload?.requirements) {
      normalized.requirements = sanitizeList(payload.requirements);
    }
    if (typeof payload?.price === 'number' && !payload.pricing) {
      normalized.pricing = { amount: payload.price, currency: (payload.currency || 'LKR'), perPerson: !!payload.perPerson };
    }
    if (payload?.coverImage) {
      normalized.coverImage = payload.coverImage;
    }
    if (payload?.details) {
      normalized.details = payload.details;
    }
    if (payload?.policies) {
      normalized.policies = payload.policies;
    }
    if (typeof payload?.maxGroupSize === 'number') {
      normalized.maxGroupSize = payload.maxGroupSize;
    }
    if (payload?.duration) {
      normalized.duration = payload.duration;
    }
    return ApiService.patch<PackageDetailResponse>(`/api/guide/tourpackages/update/${encodeURIComponent(slugOrId)}`, normalized);
  },

  async deletePackage(slugOrId: string, hard = false): Promise<PackageDetailResponse> {
    const qs = hard ? '?hard=true' : '';
    return ApiService.delete<PackageDetailResponse>(`/api/guide/tourpackages/delete/${encodeURIComponent(slugOrId)}${qs}`);
  },
  async updateGuide(idOrUsername: string, payload: any): Promise<any> {
    return ApiService.put<any>(`/api/guide/guide/update/${encodeURIComponent(idOrUsername)}`, payload);
  },
  async deleteGuide(idOrUsername: string, hard = false): Promise<any> {
    const qs = hard ? '?hard=true' : '';
    return ApiService.delete<any>(`/api/guide/guide/delete/${encodeURIComponent(idOrUsername)}${qs}`);
  },
};
