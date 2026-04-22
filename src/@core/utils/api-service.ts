import axios, { AxiosResponse } from 'axios'
import { mutate } from 'swr'
import { getStoredAsOfDate, shouldAttachAsOfDate } from 'src/utils/asOfDate'

// Define a type for the axios instance
export const axiosService = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  }
})

axiosService.interceptors.request.use(config => {
  if (shouldAttachAsOfDate(config.url, config.method)) {
    config.params = {
      ...(config.params || {}),
      as_of_date: getStoredAsOfDate()
    }
  }

  return config
})

// Define a generic type for the response data
interface ApiResponse<T> {
  data: T
}

// GET request function
export const getService = async <T>(url: string, params: Record<string, any> = {}): Promise<T> => {
  const response: AxiosResponse<ApiResponse<T>> = await axiosService.get(url, { params })

  return response.data.data
}

// POST request function
export const postService = async <T>(url: string, data: T): Promise<T> => {
  const response: AxiosResponse<ApiResponse<T>> = await axiosService.post(url, data)
  mutate(url) // Revalidate the SWR cache after POST request

  return response.data.data
}

// PUT request function
export const putService = async <T>(url: string, data: T): Promise<T> => {
  const response: AxiosResponse<ApiResponse<T>> = await axiosService.put(url, data)
  mutate(url) // Revalidate the SWR cache after PUT request

  return response.data.data
}

// PATCH request function
export const patchService = async <T>(url: string, data: Partial<T>): Promise<T> => {
  const response: AxiosResponse<ApiResponse<T>> = await axiosService.patch(url, data)
  mutate(url) // Revalidate the SWR cache after PATCH request

  return response.data.data
}

// DELETE request function
export const delService = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<ApiResponse<T>> = await axiosService.delete(url)
  mutate(url) // Revalidate the SWR cache after DELETE request

  return response.data.data
}
