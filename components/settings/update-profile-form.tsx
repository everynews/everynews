'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import { Input } from '@everynews/components/ui/input'
import { Label } from '@everynews/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const updateProfileSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
})

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

interface UpdateProfileFormProps {
  user: {
    id: string
    name: string
    email: string
  }
}

export const UpdateProfileForm = ({ user }: UpdateProfileFormProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<UpdateProfileFormData>({
    defaultValues: {
      email: user.email,
      name: user.name,
    },
    resolver: zodResolver(updateProfileSchema),
  })

  const onSubmit = async (data: UpdateProfileFormData) => {
    setIsLoading(true)
    try {
      const response = await api.users[':id'].$patch({
        json: {
          email: data.email,
          name: data.name,
        },
        param: { id: user.id },
      })

      if (response.ok) {
        toast.success('Profile updated', {
          description: 'Your profile has been updated successfully.',
        })
        router.refresh()
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (_error) {
      toast.error('Error', {
        description: 'Failed to update profile. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='name'>Name</Label>
        <Input id='name' {...form.register('name')} placeholder='Your name' />
        {form.formState.errors.name && (
          <p className='text-sm text-destructive'>
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='email'>Email</Label>
        <Input
          id='email'
          type='email'
          {...form.register('email')}
          placeholder='your@email.com'
        />
        {form.formState.errors.email && (
          <p className='text-sm text-destructive'>
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <Button type='submit' disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
