import useSWR from 'swr'
import { paginatedGet, patchFetcher, simpleGet } from 'src/api/common/fetchers'
import useSWRMutation from 'swr/mutation'
import { post } from 'src/api/common/mutations'
import { useMemo } from 'react'
import { useDebounce } from 'src/utils/useDebounce'

export const usePaginatedSWR = <T>(
  url: string,
  params: {
    page?: number
    pageSize?: number
    search?: string
    debounceMs?: number
    [key: string]: any
  }
) => {
  const { search, debounceMs = 400, ...restParams } = params

  // ✅ Debounce ONLY if search exists
  const debouncedSearch = useDebounce(search, search ? debounceMs : 0)

  // ✅ Build stable params
  const finalParams = useMemo(
    () => ({
      ...restParams,
      ...(search !== undefined && { search: debouncedSearch })
    }),
    [restParams, debouncedSearch, search]
  )

  // ✅ Stable SWR key
  const key = useMemo(() => [url, finalParams], [url, finalParams])

  return useSWR<T>(key, ([u, p]) => paginatedGet<T>(u, { arg: p }), {
    keepPreviousData: true,
    revalidateOnFocus: false
  })
}

export const useSimpleSWR = <T>(url: string) => {
  return useSWR<T>(url, simpleGet, {
    revalidateOnFocus: false
  })
}

export const useMutationSWR = <TResponse, TBody>(url: string) => {
  return useSWRMutation<TResponse, any, string, TBody>(url, post)
}

export const usePatchSWR = <TResponse, TBody>(url: string) => {
  return useSWRMutation<TResponse, any, string, TBody>(url, patchFetcher)
}
