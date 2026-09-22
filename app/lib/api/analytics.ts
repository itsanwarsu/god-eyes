import { apiFetch } from './client';

import type {
  Indicator,
  IndicatorListResponse,
  IndicatorDimensionsResponse,
  IndicatorDataResponse,
} from '@/app/types/analytics';

export async function getIndicators(params?: {
  page?: number;
  limit?: number;
  search?: string;
  domain?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.page) {
    searchParams.set('page', String(params.page));
  }

  if (params?.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params?.search) {
    searchParams.set('search', params.search);
  }

  if (params?.domain) {
    searchParams.set('domain', params.domain);
  }

  const query = searchParams.toString();

  return apiFetch<IndicatorListResponse>(
    `/analytics/indicators${query ? `?${query}` : ''}`,
  );
}

export async function getIndicator(bpsVarId: number) {
  return apiFetch<Indicator>(
    `/analytics/indicators/${bpsVarId}`,
  );
}

export async function getIndicatorDimensions(bpsVarId: number) {
  return apiFetch<IndicatorDimensionsResponse>(
    `/analytics/indicators/${bpsVarId}/dimensions`,
  );
}

export async function getIndicatorData(
  bpsVarId: number,
  filters?: {
    vervar?: string;
    turvar?: string;
    turtahun?: string;
  },
) {
  const searchParams = new URLSearchParams();

  if (filters?.vervar) {
    searchParams.set('vervar', filters.vervar);
  }

  if (filters?.turvar) {
    searchParams.set('turvar', filters.turvar);
  }

  if (filters?.turtahun) {
    searchParams.set('turtahun', filters.turtahun);
  }

  const query = searchParams.toString();

  return apiFetch<IndicatorDataResponse>(
    `/analytics/indicators/${bpsVarId}/data${query ? `?${query}` : ''}`,
  );
}

