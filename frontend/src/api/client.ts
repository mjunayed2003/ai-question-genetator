import type {
  ApiResponse,
  Document,
  ExportResponse,
  GenerateQuestionsPayload,
  MCQ,
  CQ,
  Pagination,
  QuestionSet,
  UpdateCqPayload,
  UpdateMcqPayload,
  UpdateQuestionSetPayload,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const currentUserId = localStorage.getItem('questai_user_id');
  if (currentUserId && !headers.has('x-user-id')) {
    headers.set('x-user-id', currentUserId);
  }

  const authToken = localStorage.getItem('questai_auth_token');
  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }


  const response = await fetch(url, {
    ...options,
    headers,
  });

  const rawJson = await response.json().catch(() => null);

  if (!response.ok) {
    let message = 'An unexpected error occurred';
    if (rawJson) {
      if (typeof rawJson.message === 'string') {
        message = rawJson.message;
      } else if (Array.isArray(rawJson.message)) {
        message = rawJson.message.join(', ');
      } else if (rawJson.error) {
        message = rawJson.error;
      }
    }
    throw new ApiError(message, response.status);
  }

  // If backend wraps response in TransformInterceptor: { success, statusCode, message, data }
  if (rawJson && typeof rawJson === 'object' && 'data' in rawJson && 'success' in rawJson) {
    const apiRes = rawJson as ApiResponse<T>;
    return apiRes.data;
  }

  return rawJson as T;
}

export const api = {
  // --- Health Check ---
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/documents?page=1&limit=1`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Documents Endpoints ---
  async listDocuments(page = 1, limit = 20): Promise<{ documents: Document[]; pagination: Pagination }> {
    return request<{ documents: Document[]; pagination: Pagination }>(
      `/documents?page=${page}&limit=${limit}`,
    );
  },

  async getDocument(id: string): Promise<Document> {
    return request<Document>(`/documents/${id}`);
  },

  async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    return request<Document>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async deleteDocument(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Questions Management Endpoints ---
  async generateQuestionSet(payload: GenerateQuestionsPayload): Promise<QuestionSet> {
    return request<QuestionSet>('/questions/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listQuestionSets(page = 1, limit = 20): Promise<{ questionSets: QuestionSet[]; pagination: Pagination }> {
    return request<{ questionSets: QuestionSet[]; pagination: Pagination }>(
      `/questions/sets?page=${page}&limit=${limit}`,
    );
  },

  async getQuestionSet(id: string): Promise<QuestionSet> {
    return request<QuestionSet>(`/questions/sets/${id}`);
  },

  async updateQuestionSet(id: string, payload: UpdateQuestionSetPayload): Promise<QuestionSet> {
    return request<QuestionSet>(`/questions/sets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteQuestionSet(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/questions/sets/${id}`, {
      method: 'DELETE',
    });
  },

  async exportQuestionSet(id: string): Promise<ExportResponse> {
    return request<ExportResponse>(`/questions/sets/${id}/export`);
  },

  // --- MCQ Endpoints ---
  async updateMcq(id: string, payload: UpdateMcqPayload): Promise<MCQ> {
    return request<MCQ>(`/questions/mcq/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteMcq(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/questions/mcq/${id}`, {
      method: 'DELETE',
    });
  },

  async regenerateMcq(id: string): Promise<MCQ> {
    return request<MCQ>(`/questions/mcq/${id}/regenerate`, {
      method: 'POST',
    });
  },

  // --- CQ Endpoints ---
  async updateCq(id: string, payload: UpdateCqPayload): Promise<CQ> {
    return request<CQ>(`/questions/cq/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteCq(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/questions/cq/${id}`, {
      method: 'DELETE',
    });
  },

  async regenerateCq(id: string): Promise<CQ> {
    return request<CQ>(`/questions/cq/${id}/regenerate`, {
      method: 'POST',
    });
  },

  // --- Auth Endpoints ---
  async syncUser(user: { uid: string; email: string; name?: string | null; avatar?: string | null }) {
    return request<{ id: string; email: string; name: string | null; avatar: string | null }>(
      '/auth/sync',
      {
        method: 'POST',
        body: JSON.stringify(user),
      },
    );
  },

  async getProfile(): Promise<any> {
    return request('/auth/me');
  },
};
