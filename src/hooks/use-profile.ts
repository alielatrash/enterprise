'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { UpdateProfileInput, ChangePasswordInput } from '@/lib/validations/profile'

interface ProfileData {
  id: string
  email: string
  firstName: string
  lastName: string
  mobileNumber: string | null
  avatarUrl: string | null
  role: string
  createdAt: string
  updatedAt: string
}

// Fetch current user profile
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<ProfileData> => {
      const res = await fetch('/api/profile', {
        credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to fetch profile')
      return json.data
    },
  })
}

// Update profile (name, mobile)
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to update profile')
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      router.refresh() // Refresh server components to update header
      toast.success('Profile updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    },
  })
}

// Upload avatar
export function useUploadAvatar() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to upload avatar')
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      router.refresh() // Refresh server components to update header
      toast.success('Profile picture updated')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar')
    },
  })
}

// Delete avatar
export function useDeleteAvatar() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/profile/avatar', {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to delete avatar')
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      router.refresh() // Refresh server components to update header
      toast.success('Profile picture removed')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete avatar')
    },
  })
}

// Change password
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || 'Failed to change password')
      return json.data
    },
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    },
  })
}
