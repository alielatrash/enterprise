import { z } from 'zod'

export const createDemandForecastSchema = z.object({
  planningWeekId: z.string().min(1, 'Planning week is required'),
  clientId: z.string().min(1, 'Client is required'),
  pickupCityId: z.string().min(1, 'Pickup city is required'),
  dropoffCityId: z.string().min(1, 'Dropoff city is required'),
  vertical: z.enum(['DOMESTIC', 'PORTS'], { message: 'Vertical is required' }),
  truckTypeId: z.string().min(1, 'Truck type is required'),
  day1Loads: z.number().min(0),
  day2Loads: z.number().min(0),
  day3Loads: z.number().min(0),
  day4Loads: z.number().min(0),
  day5Loads: z.number().min(0),
  day6Loads: z.number().min(0),
  day7Loads: z.number().min(0),
})

export const updateDemandForecastSchema = z.object({
  day1Loads: z.number().min(0).optional(),
  day2Loads: z.number().min(0).optional(),
  day3Loads: z.number().min(0).optional(),
  day4Loads: z.number().min(0).optional(),
  day5Loads: z.number().min(0).optional(),
  day6Loads: z.number().min(0).optional(),
  day7Loads: z.number().min(0).optional(),
  vertical: z.enum(['DOMESTIC', 'PORTS']).optional(),
  truckTypeId: z.string().optional(),
})

export type CreateDemandForecastInput = z.infer<typeof createDemandForecastSchema>
export type UpdateDemandForecastInput = z.infer<typeof updateDemandForecastSchema>
