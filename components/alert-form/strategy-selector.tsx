import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import { Input } from '@everynews/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@everynews/components/ui/tabs'
import type { AlertDto } from '@everynews/schema/alert'
import type { UseFormReturn } from 'react-hook-form'
import { STRATEGY_WITH_QUERY } from './constants'

interface StrategySelectorProps {
  form: UseFormReturn<AlertDto>
}

export const StrategySelector = ({ form }: StrategySelectorProps) => {
  const selectedProvider = form.watch('strategy.provider')
  const hasQuery = STRATEGY_WITH_QUERY.includes(selectedProvider)

  return (
    <>
      <FormField
        control={form.control}
        name='strategy.provider'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Strategy</FormLabel>
            <FormControl>
              <Tabs
                value={field.value}
                onValueChange={field.onChange}
                className='w-full'
              >
                <TabsList className='grid w-full grid-cols-5'>
                  <TabsTrigger value='hnbest'>HN Best</TabsTrigger>
                  <TabsTrigger value='popular'>Popular</TabsTrigger>
                  <TabsTrigger value='google'>Google</TabsTrigger>
                  <TabsTrigger value='recent'>Recent</TabsTrigger>
                  <TabsTrigger value='random'>Random</TabsTrigger>
                </TabsList>
              </Tabs>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {hasQuery && (
        <FormField
          control={form.control}
          name='strategy.query'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search Query</FormLabel>
              <FormControl>
                <Input
                  placeholder='Enter search terms...'
                  {...field}
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
