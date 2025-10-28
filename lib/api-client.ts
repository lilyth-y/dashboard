/**
 * API Client
 * 
 * Typed HTTP client wrapper for making API requests with automatic error handling.
 */

import { ApiError } from './api-error'

export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  code?: string
}

export interface ApiRequestOptions extends RequestInit {
  skipErrorHandling?: boolean
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    if (!response.ok) {
      // Try to parse error from response body
      if (isJson) {
        try {
          const errorData = await response.json() as { error?: string; code?: string; message?: string }
          const message = errorData.error || errorData.message || '요청 처리 중 오류가 발생했습니다.'
          const code = errorData.code || 'UNKNOWN_ERROR'
          
          throw new ApiError(response.status, message, code)
        } catch (e) {
          if (e instanceof ApiError) throw e
          // JSON 파싱 실패 시 기본 에러
          throw new ApiError(response.status, '요청 처리 중 오류가 발생했습니다.')
        }
      }
      
      // Non-JSON error response
      throw new ApiError(
        response.status,
        response.statusText || '요청 처리 중 오류가 발생했습니다.'
      )
    }

    // Success response
    if (isJson) {
      return await response.json() as T
    }

    // Non-JSON success response (e.g., 204 No Content)
    return {} as T
  }

  async get<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      ...options,
    })
    return this.handleResponse<T>(response)
  }

  async post<T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
    return this.handleResponse<T>(response)
  }

  async put<T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      ...options,
    })
    return this.handleResponse<T>(response)
  }

  async patch<T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })
    return this.handleResponse<T>(response)
  }
}

// Export singleton instance
export const apiClient = new ApiClient('/api')

// Export class for testing/custom instances
export { ApiClient }
