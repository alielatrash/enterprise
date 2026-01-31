'use client'

import { useRef, useState } from 'react'
import { Upload, Trash2, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUploadAvatar, useDeleteAvatar } from '@/hooks/use-profile'
import { toast } from 'sonner'

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  userFirstName: string
  userLastName: string
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function AvatarUpload({ currentAvatarUrl, userFirstName, userLastName }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const uploadMutation = useUploadAvatar()
  const deleteMutation = useDeleteAvatar()

  const isLoading = uploadMutation.isPending || deleteMutation.isPending

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('File must be JPEG, PNG, or WebP')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload immediately
    uploadMutation.mutate(file, {
      onSuccess: () => {
        setPreviewUrl(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      },
      onError: () => {
        setPreviewUrl(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      },
    })
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      deleteMutation.mutate()
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>Upload a photo to personalize your account</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          {displayUrl && (
            <AvatarImage src={displayUrl} alt={`${userFirstName} ${userLastName}`} />
          )}
          <AvatarFallback className="text-2xl">
            {getInitials(userFirstName, userLastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={isLoading}
            >
              {isLoading && uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}
                </>
              )}
            </Button>

            {currentAvatarUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading && deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </>
                )}
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP. Max size 5MB.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
