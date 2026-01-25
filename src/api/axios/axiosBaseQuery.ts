import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'

export interface ApiResponse<T> {
  data: T
}

// Create axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000
})

// Add request interceptor
axiosInstance.interceptors.request.use(
  config => {
    // Add token if exists
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => Promise.reject(error)
)

// Add response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const url = error.config?.url || ''

    const isAuthApi = url.includes('/login') || url.includes('/smart-login') || url.includes('/otp')

    // Handle errors globally
    if (status === 401 && !isAuthApi) {
      localStorage.removeItem('token')
      window.location.href = '/pages/login'
    }

    return Promise.reject(error)
  }
)

interface AxiosBaseQueryArgs {
  url: string
  method?: AxiosRequestConfig['method']
  data?: AxiosRequestConfig['data']
  params?: AxiosRequestConfig['params']
  headers?: AxiosRequestConfig['headers']
}

export const axiosBaseQuery: BaseQueryFn<AxiosBaseQueryArgs, unknown, AxiosError> = async ({
  url,
  method = 'GET',
  data,
  params,
  headers
}) => {
  try {
    const result = await axiosInstance({
      url,
      method,
      data,
      params,
      headers
    })

    return { data: result.data }
  } catch (axiosError) {
    const err = axiosError as AxiosError

    return { error: err as AxiosError }
  }
}

export default axiosInstance
