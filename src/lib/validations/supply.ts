import { z } from 'zod'

export const createSupplyCommitmentSchema = z.object({
  planningWeekId: z.string().min(1, 'Planning week is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  citym: z.string().min(1, 'Route is required'),
  truckTypeId: z.string().optional(),
  day1Committed: z.number().min(0),
  day2Committed: z.number().min(0),
  day3Committed: z.number().min(0),
  day4Committed: z.number().min(0),
  day5Committed: z.number().min(0),
  day6Committed: z.number().min(0),
  day7Committed: z.number().min(0),
})

export const updateSupplyCommitmentSchema = z.object({
  day1Committed: z.number().min(0).optional(),
  day2Committed: z.number().min(0).optional(),
  day3Committed: z.number().min(0).optional(),
  day4Committed: z.number().min(0).optional(),
  day5Committed: z.number().min(0).optional(),
  day6Committed: z.number().min(0).optional(),
  day7Committed: z.number().min(0).optional(),
})

export type CreateSupplyCommitmentInput = z.infer<typeof createSupplyCommitmentSchema>
export type UpdateSupplyCommitmentInput = z.infer<typeof updateSupplyCommitmentSchema>
