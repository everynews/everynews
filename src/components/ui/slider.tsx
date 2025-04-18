'use client'

import * as SliderPrimitive from '@radix-ui/react-slider'
import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'

const Slider = ({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  showTooltip = false,
  tooltipContent,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root> & {
  showTooltip?: boolean
  tooltipContent?: (value: number) => ReactNode
}) => {
  const [internalValues, setInternalValues] = useState<number[]>(
    Array.isArray(value)
      ? value
      : Array.isArray(defaultValue)
        ? defaultValue
        : [min, max],
  )

  useEffect(() => {
    if (value !== undefined) {
      setInternalValues(Array.isArray(value) ? value : [value])
    }
  }, [value])

  const handleValueChange = (newValue: number[]) => {
    setInternalValues(newValue)
    props.onValueChange?.(newValue)
  }

  const [showTooltipState, setShowTooltipState] = useState(false)

  const handlePointerDown = () => {
    if (showTooltip) {
      setShowTooltipState(true)
    }
  }

  const handlePointerUp = useCallback(() => {
    if (showTooltip) {
      setShowTooltipState(false)
    }
  }, [showTooltip])

  useEffect(() => {
    if (showTooltip) {
      document.addEventListener('pointerup', handlePointerUp)
      return () => {
        document.removeEventListener('pointerup', handlePointerUp)
      }
    }
  }, [showTooltip, handlePointerUp])

  const renderThumb = (value: number) => {
    const thumb = (
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] outline-none hover:ring-4 focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50"
        onPointerDown={handlePointerDown}
      />
    )

    if (!showTooltip) return thumb

    return (
      <TooltipProvider>
        <Tooltip open={showTooltipState}>
          <TooltipTrigger asChild>{thumb}</TooltipTrigger>
          <TooltipContent
            className="px-2 py-1 text-xs"
            sideOffset={8}
            side={props.orientation === 'vertical' ? 'right' : 'top'}
          >
            <p>{tooltipContent ? tooltipContent(value) : value}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        className,
      )}
      onValueChange={handleValueChange}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          'bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5',
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            'bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: internalValues.length }, (_, index) => (
        <Fragment key={internalValues[index]}>
          {renderThumb(internalValues[index])}
        </Fragment>
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
