import { auth } from './firebase.ts';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
  error?: string;
}

class ApiClient {
  private activeDemoRole: string = 'super_admin';
  private activeDemoEmail: string = 'superadmin@aitm.edu';

  public setDemoUser(role: string, email: string) {
    this.activeDemoRole = role;
    this.activeDemoEmail = email;
    localStorage.setItem('cms_demo_role', role);
    localStorage.setItem('cms_demo_email', email);
  }

  public getDemoRole() {
    return localStorage.getItem('cms_demo_role') || this.activeDemoRole;
  }

  public getDemoEmail() {
    return localStorage.getItem('cms_demo_email') || this.activeDemoEmail;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Demo-Role': this.getDemoRole(),
      'X-Demo-Email': this.getDemoEmail(),
    };

    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      } catch (err) {
        console.warn('Could not retrieve Firebase token:', err);
      }
    }

    return headers;
  }

  private async parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
    const contentType = res.headers.get('content-type') || '';
    let data: any = null;

    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Server returned HTML error (${res.status}): ${text.slice(0, 150)}`);
      }
      return { success: true, data: text as any };
    }

    if (!res.ok) {
      throw new Error(data?.message || data?.error || `API error ${res.status}`);
    }

    return data || { success: true };
  }

  private formatUrl(endpoint: string, params?: Record<string, any>): string {
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // If cleanEndpoint already begins with /api/v1 or /api, strip it
    if (cleanEndpoint.startsWith('/api/v1/')) {
      cleanEndpoint = cleanEndpoint.replace('/api/v1', '');
    } else if (cleanEndpoint.startsWith('/api/')) {
      cleanEndpoint = cleanEndpoint.replace('/api', '');
    }

    let url = `/api/v1${cleanEndpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return url;
  }

  private async fetchWithRetry(url: string, init: RequestInit, retries = 2, delayMs = 400): Promise<Response> {
    try {
      const res = await fetch(url, init);
      return res;
    } catch (err: any) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.fetchWithRetry(url, init, retries - 1, delayMs * 1.5);
      }
      throw new Error(`Failed to fetch (${url}): ${err?.message || 'Server connection unavailable'}`);
    }
  }

  public async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = this.formatUrl(endpoint, params);
    try {
      const headers = await this.getHeaders();
      const res = await this.fetchWithRetry(url, { method: 'GET', headers });
      return await this.parseResponse<T>(res);
    } catch (err: any) {
      console.warn(`[API GET ${endpoint} Error]:`, err.message);
      throw err;
    }
  }

  public async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const url = this.formatUrl(endpoint);
    try {
      const headers = await this.getHeaders();
      const res = await this.fetchWithRetry(url, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      return await this.parseResponse<T>(res);
    } catch (err: any) {
      console.warn(`[API POST ${endpoint} Error]:`, err.message);
      throw err;
    }
  }

  public async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const url = this.formatUrl(endpoint);
    try {
      const headers = await this.getHeaders();
      const res = await this.fetchWithRetry(url, {
        method: 'PUT',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      return await this.parseResponse<T>(res);
    } catch (err: any) {
      console.warn(`[API PUT ${endpoint} Error]:`, err.message);
      throw err;
    }
  }

  public async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const url = this.formatUrl(endpoint);
    try {
      const headers = await this.getHeaders();
      const res = await this.fetchWithRetry(url, {
        method: 'PATCH',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      return await this.parseResponse<T>(res);
    } catch (err: any) {
      console.warn(`[API PATCH ${endpoint} Error]:`, err.message);
      throw err;
    }
  }

  public async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const url = this.formatUrl(endpoint);
    try {
      const headers = await this.getHeaders();
      const res = await this.fetchWithRetry(url, {
        method: 'DELETE',
        headers,
      });
      return await this.parseResponse<T>(res);
    } catch (err: any) {
      console.warn(`[API DELETE ${endpoint} Error]:`, err.message);
      throw err;
    }
  }
}

export const api = new ApiClient();
