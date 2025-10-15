import { ApiService } from './api';

export interface GuideListItem {
  username: string;
  avatar?: string;
  role: 'guide';
  status?: string;
  guideDetails?: {
    firstName?: string;
    lastName?: string;
    approvedAt?: string | null;
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
    // Default to active status unless explicitly overridden
    const query = buildQuery({ limit: 20, page: 1, status: 'active', ...params });
    // API Gateway route: /api/listing/tourguide-listing/allguides
    return ApiService.get<GuidesListResponse>(`/api/listing/tourguide-listing/allguides${query}`);
  },
  async getGuideByUsername(username: string, status: 'active' | 'pending' | 'suspended' | 'rejected' = 'active'): Promise<GuideDetailResponse> {
    const usp = new URLSearchParams();
    if (status) usp.set('status', status);
    const qs = usp.toString() ? `?${usp.toString()}` : '';
    // API Gateway route: /api/listing/service/tourguide-listing/guide/:username
    return ApiService.get<GuideDetailResponse>(`/api/listing/service/tourguide-listing/guide/${encodeURIComponent(username)}${qs}`);
  },
  async listFeaturedGuides(limit = 10, status: 'active' | 'pending' | 'suspended' | 'rejected' = 'active'): Promise<GuidesListResponse> {
    const usp = new URLSearchParams();
    if (limit) usp.set('limit', String(limit));
    if (status) usp.set('status', status);
    const qs = usp.toString() ? `?${usp.toString()}` : '';
    // API Gateway route: /api/listing/service/tourguide-listing/featuredguides
    return ApiService.get<GuidesListResponse>(`/api/listing/service/tourguide-listing/featuredguides${qs}`);
  }
};
