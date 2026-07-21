import axios, { AxiosInstance } from 'axios';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Thin wrapper around axios. Kept separate from UnsplashApi so the HTTP
 * plumbing (timeouts, auth headers, error normalization) is reusable
 * across any future data source.
 */
export class ApiClient {
  private readonly instance: AxiosInstance;

  constructor(baseURL: string, accessKey: string, timeoutMs = 10000) {
    this.instance = axios.create({
      baseURL,
      timeout: timeoutMs,
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.instance.get<T>(path, { params });
      return response.data;
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  private normalizeError(err: unknown): ApiError {
    if (axios.isAxiosError(err)) {
      if (!err.response) {
        return new ApiError('Network unavailable', undefined, true);
      }
      return new ApiError(
        err.response.data?.errors?.[0] ?? `Request failed with status ${err.response.status}`,
        err.response.status
      );
    }
    return new ApiError('Unknown error occurred');
  }
}
