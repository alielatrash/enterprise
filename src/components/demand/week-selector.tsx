'use client'

import { CalendarDays } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePlanningWeeks } from '@/hooks/use-demand'

interface WeekSelectorProps {
  value: string | undefined
  onValueChange: (value: string) => void
}

export function WeekSelector({ value, onValueChange }: WeekSelectorProps) {
  const { data, isLoading } = usePlanningWeeks()

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger className="w-[280px]">
        <CalendarDays className="mr-2 h-4 w-4" />
        <SelectValue placeholder={isLoading ? 'Loading...' : 'Select planning week'} />
      </SelectTrigger>
      <SelectContent>
        {data?.data?.map((week) => (
          <SelectItem key={week.id} value={week.id}>
            Week {week.weekNumber} - {week.display}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
