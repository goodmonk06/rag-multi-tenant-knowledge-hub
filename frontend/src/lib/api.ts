const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Tenants
export const tenantApi = {
  list: () => fetchApi('/tenants'),
  get: (id: string) => fetchApi(`/tenants/${id}`),
  create: (data: { name: string }) => fetchApi('/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchApi(`/tenants/${id}`, { method: 'DELETE' }),
};

// Knowledge Bases
export const kbApi = {
  list: (tenantId?: string) => fetchApi(`/kb${tenantId ? `?tenantId=${tenantId}` : ''}`),
  get: (id: string) => fetchApi(`/kb/${id}`),
  create: (data: { tenantId: string; name: string; description?: string }) =>
    fetchApi('/kb', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => fetchApi(`/kb/${id}`, { method: 'DELETE' }),
};

// Ingestion
export const ingestionApi = {
  ingestText: (kbId: string, data: { text: string; metadata?: any }) =>
    fetchApi(`/kb/${kbId}/ingest/text`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  ingestUrl: (kbId: string, data: { url: string; metadata?: any }) =>
    fetchApi(`/kb/${kbId}/ingest/url`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Query
export const queryApi = {
  query: (kbId: string, data: { query: string; topK?: number; includeMetadata?: boolean }) =>
    fetchApi(`/kb/${kbId}/query`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getQueryLogs: (kbId: string, limit?: number) =>
    fetchApi(`/kb/${kbId}/queries${limit ? `?limit=${limit}` : ''}`),
};
