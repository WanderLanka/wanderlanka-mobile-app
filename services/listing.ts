import { ApiService } from './api';
import { API_CONFIG } from './config';
import slugify from 'slugify';

export interface GuideListItem {
  _id?: string;
  username: string;
  status?: string;
  featured?: boolean;
  details?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  // Back-compat for existing screens that use `guideDetails`
  guideDetails?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    approvedAt?: string | null;
  };
  metrics?: {
    rating?: number;
    totalReviews?: number;
  };
}

export interface GuidesListResponse {
  success: boolean;
  data: GuideListItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GuideDetailResponse {
  success: boolean;
  data: GuideListItem;
}

export type ListGuidesParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: 'active' | 'pending' | 'suspended' | 'rejected';
};

const buildQuery = (params: ListGuidesParams = {}) => {
  const usp = new URLSearchParams();
  if (params.page) usp.set('page', String(params.page));
  if (params.limit) usp.set('limit', String(params.limit));
  if (params.q) usp.set('q', params.q);
  if (params.status) usp.set('status', params.status);
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
};

export const ListingService = {
  async listGuides(params: ListGuidesParams = {}): Promise<GuidesListResponse> {
    // No default filters; list as-is
    const query = buildQuery(params);
    // Guide-service route: /api/guide/guide/list
    const res = await ApiService.get<GuidesListResponse>(`/api/guide/guide/list${query}`);
    // Normalize to include legacy `guideDetails` for existing UI
    const normalized: GuidesListResponse = {
      ...res,
      data: (res.data || []).map((g: any) => ({
        ...g,
        guideDetails: g.guideDetails || g.details || undefined,
      })),
    };
    return normalized;
  },
  async getGuideByUsername(username: string, status?: 'active' | 'pending' | 'suspended' | 'rejected'): Promise<GuideDetailResponse> {
    const usp = new URLSearchParams();
    if (status) usp.set('status', status);
    const qs = usp.toString() ? `?${usp.toString()}` : '';
    const base = API_CONFIG.BASE_URL?.replace(/\/$/, '') || '';

    const tryFetch = async (handle: string) => {
      const url = `${base}/api/guide/guide/get/${encodeURIComponent(handle)}${qs}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const json = await res.json();
      return json as GuideDetailResponse;
    };

    // Try raw username first
    let out = await tryFetch(username);
    if (!out) {
      // Try slugified username variant (backend matches exact username only)
      const slug = slugify(username, { lower: true, strict: true });
      if (slug && slug !== username) {
        out = await tryFetch(slug);
      }
    }

    if (!out) {
      // Keep the same error behavior for callers relying on try/catch fallback,
      // but avoid ApiService logging a loud error.
      throw new Error('Guide not found');
    }

    return {
      ...out,
      data: {
        ...out.data,
        guideDetails: (out.data as any)?.guideDetails || (out.data as any)?.details || undefined,
      },
    };
  },
  async listFeaturedGuides(limit = 10, status: 'active' | 'pending' | 'suspended' | 'rejected' = 'active'): Promise<GuidesListResponse> {
    const usp = new URLSearchParams();
    if (limit) usp.set('limit', String(limit));
    if (status) usp.set('status', status);
    const qs = usp.toString() ? `?${usp.toString()}` : '';
    // Guide-service route: /api/guide/featuredguides
    const res = await ApiService.get<GuidesListResponse>(`/api/guide/featuredguides${qs}`);
    const normalized: GuidesListResponse = {
      ...res,
      data: (res.data || []).map((g: any) => ({
        ...g,
        guideDetails: g.guideDetails || g.details || undefined,
      })),
    };
    return normalized;
  }
};
