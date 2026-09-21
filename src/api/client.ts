import axios, { type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('shorebird_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      '请求发生未知错误'

    if (status === 401) {
      localStorage.removeItem('shorebird_token')
      if (window.location.pathname !== '/login') {
        ElMessage.error('认证失败或 Token 已过期，请重新登录')
        window.location.href = '/login'
      }
    } else if (status === 403) {
      ElMessage.error('权限不足，禁止访问')
    } else if (status === 404) {
      ElMessage.warning('请求的资源不存在')
    } else if (status && status >= 500) {
      ElMessage.error(`服务端异常 (${status}): ${message}`)
    }

    return Promise.reject(error)
  },
)

/**
 * Custom mutator function for Orval
 */
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return apiClient({
    ...config,
    ...options,
  }).then((response: AxiosResponse<T>) => response.data)
}

export default apiClient
