import { DiscordIcon } from '@everynews/components/discord-icon'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@everynews/components/ui/form'
import {
  RadioGroup,
  RadioGroupItem,
} from '@everynews/components/ui/radio-group'
import type { ChannelDto } from '@everynews/schema/channel'
import { Mail, Phone, Slack } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

interface ChannelTypeSelectorProps {
  form: UseFormReturn<ChannelDto>
  channelType: 'email' | 'phone' | 'slack' | 'discord'
  setChannelType: (type: 'email' | 'phone' | 'slack' | 'discord') => void
  emailId: string
  phoneId: string
  slackId: string
  discordId: string
}

export const ChannelTypeSelector = ({
  form,
  channelType,
  setChannelType,
  emailId,
  phoneId,
  slackId,
  discordId,
}: ChannelTypeSelectorProps) => {
  return (
    <FormField
      control={form.control}
      name='type'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Channel Type</FormLabel>
          <FormControl>
            <RadioGroup
              className='gap-2 lg:grid lg:grid-cols-2'
              value={channelType}
              onValueChange={(value) => {
                setChannelType(value as 'email' | 'phone' | 'slack' | 'discord')
                field.onChange(value)
              }}
            >
              <label
                htmlFor={emailId}
                className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none cursor-pointer'
              >
                <div className='grid grow gap-2'>
                  <div className='flex items-center gap-2'>
                    <Mail className='size-4' />
                    <span className='font-medium'>Email</span>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    Receive alerts directly to your email inbox
                  </p>
                </div>
                <RadioGroupItem
                  value='email'
                  id={emailId}
                  className='order-1'
                />
              </label>

              <label
                htmlFor={phoneId}
                className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none cursor-pointer'
              >
                <div className='grid grow gap-2'>
                  <div className='flex items-center gap-2'>
                    <Phone className='size-4' />
                    <span className='font-medium'>SMS</span>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    Get text messages for important alerts
                  </p>
                </div>
                <RadioGroupItem
                  value='phone'
                  id={phoneId}
                  className='order-1'
                />
              </label>

              <label
                htmlFor={slackId}
                className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none cursor-pointer'
              >
                <div className='grid grow gap-2'>
                  <div className='flex items-center gap-2'>
                    <Slack className='size-4' />
                    <span className='font-medium'>Slack</span>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    Send alerts to your Slack workspace
                  </p>
                </div>
                <RadioGroupItem
                  value='slack'
                  id={slackId}
                  className='order-1'
                />
              </label>

              <label
                htmlFor={discordId}
                className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none cursor-pointer'
              >
                <div className='grid grow gap-2'>
                  <div className='flex items-center gap-2'>
                    <DiscordIcon className='size-4' />
                    <span className='font-medium'>Discord</span>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    Send alerts to your Discord server
                  </p>
                </div>
                <RadioGroupItem
                  value='discord'
                  id={discordId}
                  className='order-1'
                />
              </label>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  )
}
