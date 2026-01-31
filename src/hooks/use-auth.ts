'use client'

import { useQuery } from '@tanstack/react-query'
import type { SessionUser } from '@/types'

interface AuthResponse {
  user: SessionUser
}

export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<AuthResponse> => {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to fetch user')
      return json.data
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: false,
  })
}
