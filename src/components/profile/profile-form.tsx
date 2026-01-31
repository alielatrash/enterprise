'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUpdateProfile } from '@/hooks/use-profile'
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/profile'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileFormProps {
  profile: {
    firstName: string
    lastName: string
    mobileNumber: string | null
    email: string
    role: string
    createdAt: string
  }
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const updateMutation = useUpdateProfile()

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      mobileNumber: profile.mobileNumber || '',
    },
  })

  const onSubmit = (data: UpdateProfileInput) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        form.reset(data)
      },
    })
  }

  const hasChanges = form.formState.isDirty

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+1234567890" />
                  </FormControl>
                  <FormDescription>
                    Optional. Include country code for international numbers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
              <div>
                <FormLabel>Email</FormLabel>
                <Input value={profile.email} disabled className="mt-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Email cannot be changed. Contact your administrator if you need to update it.
                </p>
              </div>

              <div>
                <FormLabel>Role</FormLabel>
                <div className="mt-2">
                  <Badge variant="secondary">{profile.role.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Your role determines your access permissions in the system.
                </p>
              </div>

              <div>
                <FormLabel>Member Since</FormLabel>
                <p className="text-sm text-muted-foreground mt-2">
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={!hasChanges || updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              {hasChanges && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={updateMutation.isPending}
                >
                  Discard Changes
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
