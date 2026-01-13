import axiosInstance from '../axios/axiosBaseQuery'
import { AxiosResponse } from 'axios'
import { ApiResponse } from '../axios/axiosTypes'

export const post = async <T>(url: string, { arg }: { arg: any }): Promise<T> => {
  const res: AxiosResponse<ApiResponse<T>> = await axiosInstance.post(url, arg)

  return res.data.data
}
