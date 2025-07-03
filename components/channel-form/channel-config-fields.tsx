import { PhoneInputField } from '@everynews/components/phone-input-field'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import { Input } from '@everynews/components/ui/input'
import type { ChannelDto } from '@everynews/schema/channel'
import type { UseFormReturn } from 'react-hook-form'

interface ChannelConfigFieldsProps {
  form: UseFormReturn<ChannelDto>
  channelType: 'email' | 'phone' | 'slack' | 'discord'
}

export const ChannelConfigFields = ({
  form,
  channelType,
}: ChannelConfigFieldsProps) => {
  if (channelType === 'email') {
    return (
      <FormField
        control={form.control}
        name='config.destination'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address</FormLabel>
            <FormControl>
              <Input
                type='email'
                placeholder='your@email.com'
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (channelType === 'phone') {
    return (
      <FormField
        control={form.control}
        name='config.destination'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <PhoneInputField
                placeholder='+1 (555) 123-4567'
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (channelType === 'slack') {
    return (
      <div className='space-y-2'>
        <p className='text-sm text-muted-foreground'>
          Click "Continue" to connect your Slack workspace
        </p>
      </div>
    )
  }

  if (channelType === 'discord') {
    return (
      <div className='space-y-2'>
        <p className='text-sm text-muted-foreground'>
          Click "Continue" to connect your Discord server
        </p>
      </div>
    )
  }

  return null
}
