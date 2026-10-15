export class ApiClient {
  private token: string | null;
  private sessionVersion = 0;
  private refreshPromise: Promise<string> | null = null;
  private tokenListeners = new Set<(token: string | null) => void>();
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('pulse_access_token');
  }

  public setToken(token: string | null) {
    this.sessionVersion += 1;
    this.token = token;
    this.refreshPromise = null;
    if (token) {
      localStorage.setItem('pulse_access_token', token);
    } else {
      localStorage.removeItem('pulse_access_token');
    }
    this.tokenListeners.forEach((listener) => listener(token));
  }

  public getToken(): string | null {
    return this.token;
  }

  public subscribeToken(listener: (token: string | null) => void): () => void {
    this.tokenListeners.add(listener);
    return () => { this.tokenListeners.delete(listener); };
  }

  private refreshToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;

    const version = this.sessionVersion;
    const refresh = async () => {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && version === this.sessionVersion) {
          this.setToken(null);
        }
        throw data.error || { message: `Request failed with status ${response.status}` };
      }
      // An in-flight refresh must not restore a logged-out or replaced session.
      if (version !== this.sessionVersion) {
        throw { message: 'Session changed while refreshing' };
      }
      if (typeof data.accessToken !== 'string' || !data.accessToken) {
        throw { message: 'Invalid token refresh response' };
      }
      this.setToken(data.accessToken);
      return data.accessToken as string;
    };

    const pending = refresh().finally(() => {
      if (this.refreshPromise === pending) this.refreshPromise = null;
    });
    this.refreshPromise = pending;
    return pending;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const currentToken = this.getToken();
    const version = this.sessionVersion;
    if (currentToken) headers.set('Authorization', `Bearer ${currentToken}`);

    const send = () => fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
    let response = await send();

    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
      if (version !== this.sessionVersion && !this.getToken()) {
        throw { message: 'Session ended' };
      }
      // A delayed 401 may arrive after another request has already refreshed.
      const token = this.getToken() !== currentToken
        ? this.getToken()
        : await this.refreshToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
        response = await send();
        if (response.status === 401 && this.getToken() === token) this.setToken(null);
      }
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw data.error || { message: `Request failed with status ${response.status}` };
    }
    return data as T;
  }
}
