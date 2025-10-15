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
    // API Gateway route: /api/listing/guides
    return ApiService.get<GuidesListResponse>(`/api/listing/guides${query}`);
  },
};
