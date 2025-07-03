import { Combobox } from '@everynews/components/ui/combobox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import type { AlertDto } from '@everynews/schema/alert'
import { getLanguageOptions } from '@everynews/schema/language'
import type { UseFormReturn } from 'react-hook-form'

interface LanguageSelectorProps {
  form: UseFormReturn<AlertDto>
}

export const LanguageSelector = ({ form }: LanguageSelectorProps) => {
  const languageOptions = getLanguageOptions()
  const comboboxOptions = languageOptions.map((option) => ({
    label: option.label,
    value: option.code,
  }))

  return (
    <FormField
      control={form.control}
      name='languageCode'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Language</FormLabel>
          <FormControl>
            <Combobox
              options={comboboxOptions}
              value={field.value}
              onValueChange={field.onChange}
              placeholder='Select a language'
              searchPlaceholder='Search languages...'
              emptyText='No language found.'
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
