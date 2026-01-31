'use client'

import { PageHeader } from '@/components/layout'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { ProfileForm } from '@/components/profile/profile-form'
import { ChangePasswordForm } from '@/components/profile/change-password-form'
import { useProfile } from '@/hooks/use-profile'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Profile Settings"
          description="Manage your account information and preferences"
        />
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div>
        <PageHeader
          title="Profile Settings"
          description="Manage your account information and preferences"
        />
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load profile. Please try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Profile Settings"
        description="Manage your account information and preferences"
      />

      <div className="space-y-6">
        <AvatarUpload
          currentAvatarUrl={profile.avatarUrl}
          userFirstName={profile.firstName}
          userLastName={profile.lastName}
        />

        <ProfileForm profile={profile} />

        <ChangePasswordForm />
      </div>
    </div>
  )
}
