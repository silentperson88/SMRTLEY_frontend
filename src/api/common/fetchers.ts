import axiosInstance from '../axios/axiosBaseQuery'
import { AxiosResponse } from 'axios'
import { ApiResponse } from '../axios/axiosTypes'

export const simpleGet = async <T>(url: string): Promise<T> => {
  const res: AxiosResponse<ApiResponse<T>> = await axiosInstance.get(url)

  return res.data.data
}

export const paginatedGet = async <T>(
  url: string,
  {
    arg
  }: {
    arg: {
      page?: number
      pageSize?: number
      search?: string
      [key: string]: any
    }
  }
): Promise<T> => {
  const res: AxiosResponse<ApiResponse<T>> = await axiosInstance.get(url, {
    params: arg
  })

  return res.data.data
}

// Patch fetcher function
export async function patchFetcher<T>(url: string, { arg }: { arg: any }): Promise<T> {
  console.log(url, arg)
  const response: AxiosResponse<ApiResponse<T>> = await axiosInstance.patch(url, arg)

  return response.data.data;
}
