// API client for backend memory service
import type { 
  ServiceConfig, 
  StoreShortTermRequest, 
  StoreLongTermRequest,
  ApiResponse 
} from '../../lib/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Service Configuration API
export const serviceAPI = {
  create: async (config: ServiceConfig) => {
    return fetchAPI<ServiceConfig>('/services/create', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  get: async (id: string) => {
    return fetchAPI<ServiceConfig>(`/services/${id}`, {
      method: 'GET',
    });
  },

  update: async (id: string, updates: Partial<ServiceConfig>) => {
    return fetchAPI<ServiceConfig>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return fetchAPI<{ deleted: string }>(`/services/${id}`, {
      method: 'DELETE',
    });
  },

  list: async () => {
    return fetchAPI<ServiceConfig[]>('/services/list', {
      method: 'GET',
    });
  },
};

// Memory API
export const memoryAPI = {
  // Short-term memory
  storeShortTerm: async (request: StoreShortTermRequest) => {
    return fetchAPI('/memory/short-term/store', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  retrieveShortTerm: async (sessionId: string, serviceId: string, limit?: number) => {
    const params = new URLSearchParams({
      session_id: sessionId,
      service_id: serviceId
    });
    if (limit) params.append('limit', limit.toString());

    return fetchAPI(`/memory/short-term/retrieve?${params}`, {
      method: 'GET',
    });
  },

  // Long-term memory
  storeLongTerm: async (request: StoreLongTermRequest) => {
    return fetchAPI('/memory/long-term/store', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  retrieveLongTerm: async (
    userId: string,
    serviceId: string,
    bucketName?: string
  ) => {
    const params = new URLSearchParams({
      user_id: userId,
      service_id: serviceId,
    });
    if (bucketName) params.append('bucket_name', bucketName);

    return fetchAPI(`/memory/long-term/retrieve?${params}`, {
      method: 'GET',
    });
  },
};

