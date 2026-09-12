const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('pulse_access_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('pulse_access_token', token);
    } else {
      localStorage.removeItem('pulse_access_token');
    }
  }

  public getToken(): string | null {
    return this.token || localStorage.getItem('pulse_access_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const currentToken = this.getToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      // Attempt token refresh
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          this.setToken(refreshData.accessToken);
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          const retryRes = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
          });
          const retryData = await retryRes.json();
          if (!retryRes.ok) {
            throw retryData.error || { message: 'API request failed' };
          }
          return retryData as T;
        } else {
          this.setToken(null);
        }
      } catch {
        this.setToken(null);
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw data.error || { message: `Request failed with status ${response.status}` };
    }

    return data as T;
  }

  // Auth endpoints
  public login(credentials: { email: string; password: string }) {
    return this.request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  public logout() {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  public getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  public getUsers(role?: string) {
    const query = new URLSearchParams();
    if (role) query.set('role', role);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ users: any[] }>(`/users${qs}`);
  }

  public createUser(data: { name: string; email: string; password: string; role: string }) {
    return this.request<{ user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public updateUser(id: string, data: { name?: string; email?: string; role?: string }) {
    return this.request<{ user: any }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Clients endpoints
  public getClients() {
    return this.request<{ clients: any[] }>('/clients');
  }

  public createClient(data: { name: string }) {
    return this.request<{ client: any }>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Projects endpoints
  public getProjects(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ projects: any[]; pagination: any }>(`/projects${qs}`);
  }

  public getProjectById(id: string) {
    return this.request<{ project: any }>(`/projects/${id}`);
  }

  public createProject(data: { name: string; clientId: string }) {
    return this.request<{ project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public updateProject(id: string, data: { name?: string; clientId?: string }) {
    return this.request<{ project: any }>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public deleteProject(id: string) {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks endpoints
  public getTasks(filters?: {
    projectId?: string;
    status?: string;
    priority?: string;
    isOverdue?: boolean | string;
    dueBefore?: string;
    dueAfter?: string;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (filters?.projectId) query.set('projectId', filters.projectId);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.priority) query.set('priority', filters.priority);
    if (filters?.isOverdue !== undefined) query.set('isOverdue', String(filters.isOverdue));
    if (filters?.dueBefore) query.set('dueBefore', filters.dueBefore);
    if (filters?.dueAfter) query.set('dueAfter', filters.dueAfter);
    if (filters?.assignedToId) query.set('assignedToId', filters.assignedToId);
    if (filters?.page) query.set('page', String(filters.page));
    if (filters?.limit) query.set('limit', String(filters.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ tasks: any[]; pagination: any }>(`/tasks${qs}`);
  }

  public getProjectTasks(projectId: string, filters?: {
    status?: string;
    priority?: string;
    dueBefore?: string;
    dueAfter?: string;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (filters?.status) query.set('status', filters.status);
    if (filters?.priority) query.set('priority', filters.priority);
    if (filters?.dueBefore) query.set('dueBefore', filters.dueBefore);
    if (filters?.dueAfter) query.set('dueAfter', filters.dueAfter);
    if (filters?.assignedToId) query.set('assignedToId', filters.assignedToId);
    if (filters?.page) query.set('page', String(filters.page));
    if (filters?.limit) query.set('limit', String(filters.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ tasks: any[]; pagination: any }>(`/projects/${projectId}/tasks${qs}`);
  }

  public createTask(projectId: string, data: {
    title: string;
    description?: string | null;
    assignedToId?: string | null;
    priority?: string;
    dueDate?: string | null;
    status?: string;
  }) {
    return this.request<{ task: any }>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public getTaskById(id: string) {
    return this.request<{ task: any }>(`/tasks/${id}`);
  }

  public updateTaskStatus(id: string, status: string) {
    return this.request<{ task: any; activityLog: any }>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  public updateTask(id: string, data: {
    title?: string;
    description?: string | null;
    assignedToId?: string | null;
    priority?: string;
    dueDate?: string | null;
    status?: string;
  }) {
    return this.request<{ task: any }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public getNotifications(page = 1, limit = 20) {
    return this.request<{
      notifications: any[];
      unreadCount: number;
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/notifications?page=${page}&limit=${limit}`);
  }

  public getUnreadNotificationsCount() {
    return this.request<{ unreadCount: number }>('/notifications/unread-count');
  }

  public markNotificationAsRead(id: string | number) {
    return this.request<{ notification: any; unreadCount: number }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  public markAllNotificationsAsRead() {
    return this.request<{ message: string; count: number; unreadCount: number }>(
      '/notifications/read-all',
      {
        method: 'PATCH',
      }
    );
  }
}

export const api = new ApiClient();
