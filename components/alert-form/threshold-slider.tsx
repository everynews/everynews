import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import { Slider } from '@everynews/components/ui/slider'
import type { AlertDto } from '@everynews/schema/alert'
import type { UseFormReturn } from 'react-hook-form'

interface ThresholdSliderProps {
  form: UseFormReturn<AlertDto>
}

export const ThresholdSlider = ({ form }: ThresholdSliderProps) => {
  return (
    <FormField
      control={form.control}
      name='threshold'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Quality Threshold: {field.value}%</FormLabel>
          <FormControl>
            <Slider
              value={[field.value]}
              onValueChange={(value) => field.onChange(value[0])}
              max={100}
              step={1}
              className='py-4'
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
