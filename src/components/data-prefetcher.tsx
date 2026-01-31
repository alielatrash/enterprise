'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

// Prefetches master data in the background on app load
export function DataPrefetcher() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Prefetch master data immediately in the background
    const prefetchMasterData = async () => {
      const params = { isActive: true }

      // Clients
      queryClient.prefetchQuery({
        queryKey: ['clients', { ...params, pageSize: 500 }],
        queryFn: async () => {
          const response = await fetch('/api/clients?isActive=true&pageSize=500', {
            credentials: 'include',
          })
          return response.json()
        },
        staleTime: 60 * 60 * 1000, // 1 hour
      })

      // Cities
      queryClient.prefetchQuery({
        queryKey: ['cities', { ...params, pageSize: 500 }],
        queryFn: async () => {
          const response = await fetch('/api/cities?isActive=true&pageSize=500', {
            credentials: 'include',
          })
          return response.json()
        },
        staleTime: 60 * 60 * 1000, // 1 hour
      })

      // Truck Types
      queryClient.prefetchQuery({
        queryKey: ['truckTypes', { ...params, pageSize: 100 }],
        queryFn: async () => {
          const response = await fetch('/api/truck-types?isActive=true&pageSize=100', {
            credentials: 'include',
          })
          return response.json()
        },
        staleTime: 60 * 60 * 1000, // 1 hour
      })

      // Suppliers
      queryClient.prefetchQuery({
        queryKey: ['suppliers', { ...params, pageSize: 100 }],
        queryFn: async () => {
          const response = await fetch('/api/suppliers?isActive=true&pageSize=100', {
            credentials: 'include',
          })
          return response.json()
        },
        staleTime: 60 * 60 * 1000, // 1 hour
      })
    }

    prefetchMasterData()
  }, [queryClient])

  return null
}
