import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiService {
  private client: AxiosInstance;
  private csrfToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/',
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
      },
      timeout: 15000,
    });

    // Request interceptor to add CSRF token for non-safe methods
    this.client.interceptors.request.use((config) => {
      const method = config.method?.toUpperCase();
      if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        if (this.csrfToken) {
          config.headers['X-CSRF-Token'] = this.csrfToken;
        }
      }
      return config;
    });

    // Response interceptor to normalize error messages
    this.client.interceptors.response.use(
      (response) => {
        // If the response body carries a new CSRF token, store it
        if (response.data && typeof response.data === 'object' && response.data.csrf_token) {
          this.csrfToken = response.data.csrf_token;
        }
        return response;
      },
      (error: AxiosError<{ error?: string; code?: string }>) => {
        const errorData = error.response?.data;
        const message = errorData?.error || error.message || 'An unexpected error occurred';
        const code = errorData?.code;
        const status = error.response?.status;

        return Promise.reject({
          message,
          code,
          status,
          originalError: error,
        });
      }
    );
  }

  public setCsrfToken(token: string | null) {
    this.csrfToken = token;
  }

  public getCsrfToken(): string | null {
    return this.csrfToken;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async postForm<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      ...config,
      headers: {
        ...(config?.headers || {}),
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for uploads
    });
    return response.data;
  }
}

export const api = new ApiService();
