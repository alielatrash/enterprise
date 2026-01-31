'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSuppliers } from '@/hooks/use-repositories'
import { useCreateSupplyCommitment } from '@/hooks/use-supply'
import { createSupplyCommitmentSchema, type CreateSupplyCommitmentInput } from '@/lib/validations/supply'
import { WEEK_DAYS } from '@/types'
import { formatCitym } from '@/lib/citym'

interface SupplyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planningWeekId: string
  citym: string
}

export function SupplyFormDialog({ open, onOpenChange, planningWeekId, citym }: SupplyFormDialogProps) {
  // Only fetch suppliers when dialog is open
  const { data: suppliers } = useSuppliers({ isActive: true, pageSize: 100 }, open)
  const createMutation = useCreateSupplyCommitment()

  const form = useForm<CreateSupplyCommitmentInput>({
    resolver: zodResolver(createSupplyCommitmentSchema),
    defaultValues: {
      planningWeekId: '',
      supplierId: '',
      citym: '',
      day1Committed: 0,
      day2Committed: 0,
      day3Committed: 0,
      day4Committed: 0,
      day5Committed: 0,
      day6Committed: 0,
      day7Committed: 0,
    },
  })

  useEffect(() => {
    if (open && planningWeekId && citym) {
      form.reset({
        planningWeekId,
        supplierId: '',
        citym,
        day1Committed: 0,
        day2Committed: 0,
        day3Committed: 0,
        day4Committed: 0,
        day5Committed: 0,
        day6Committed: 0,
        day7Committed: 0,
      })
    }
  }, [open, planningWeekId, citym, form])

  const onSubmit = async (data: CreateSupplyCommitmentInput) => {
    try {
      await createMutation.mutateAsync(data)
      toast.success('Supply commitment added successfully')
      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add commitment')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Supply Commitment</DialogTitle>
          <DialogDescription>
            Add supplier commitment for route: <strong>{formatCitym(citym)}</strong>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers?.data?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Daily Committed Supply (Sun-Sat)</FormLabel>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {WEEK_DAYS.map((day, index) => (
                  <FormField
                    key={day.key}
                    control={form.control}
                    name={`day${index + 1}Committed` as keyof CreateSupplyCommitmentInput}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">{day.label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            className="text-center"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Commitment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
