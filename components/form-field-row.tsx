import { FormItem, FormLabel } from '@everynews/components/ui/form'
import { cn } from '@everynews/lib/utils'
import type { ReactNode } from 'react'

type FormFieldRowProps = {
  label: ReactNode
  children: ReactNode
  labelWidth?: '1/2' | '1/3' | '1/4'
  className?: string
}

export const FormFieldRow = ({
  label,
  children,
  labelWidth = '1/3',
  className,
}: FormFieldRowProps) => (
  <FormItem
    className={cn('md:flex md:items-center md:justify-between', className)}
  >
    <div className={cn(`md:w-${labelWidth}`)}>
      <FormLabel className='text-md'>{label}</FormLabel>
    </div>
    <div className='md:flex-1'>{children}</div>
  </FormItem>
)
