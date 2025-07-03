import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import { Input } from '@everynews/components/ui/input'
import {
  RadioGroup,
  RadioGroupItem,
} from '@everynews/components/ui/radio-group'
import type { AlertDto } from '@everynews/schema/alert'
import type { UseFormReturn } from 'react-hook-form'

interface WaitTypeSelectorProps {
  form: UseFormReturn<AlertDto>
}

export const WaitTypeSelector = ({ form }: WaitTypeSelectorProps) => {
  const waitType = form.watch('wait.type')

  return (
    <>
      <FormField
        control={form.control}
        name='wait.type'
        render={({ field }) => (
          <FormItem className='space-y-3'>
            <FormLabel>When do you want to be alerted?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className='flex flex-col space-y-1'
              >
                <FormItem className='flex items-center space-x-3 space-y-0'>
                  <FormControl>
                    <RadioGroupItem value='count' />
                  </FormControl>
                  <FormLabel className='font-normal'>
                    After a certain number of stories
                  </FormLabel>
                </FormItem>
                <FormItem className='flex items-center space-x-3 space-y-0'>
                  <FormControl>
                    <RadioGroupItem value='schedule' />
                  </FormControl>
                  <FormLabel className='font-normal'>
                    On a fixed schedule
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {waitType === 'count' && (
        <FormField
          control={form.control}
          name='wait.value'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of stories</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  placeholder='10'
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  )
}
