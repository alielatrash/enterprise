import { startOfWeek, endOfWeek, getWeek, getYear, addWeeks, format } from 'date-fns'
import { prisma } from './prisma'

// Get the Sunday of the week containing the given date
export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 0 }) // 0 = Sunday
}

// Get the Saturday of the week containing the given date
export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 0 })
}

// Get week number (ISO week)
export function getWeekNumber(date: Date = new Date()): number {
  return getWeek(date, { weekStartsOn: 0 })
}

// Format week display string
export function formatWeekDisplay(weekStart: Date, weekEnd: Date): string {
  return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
}

// Get or create planning week
export async function getOrCreatePlanningWeek(date: Date = new Date()) {
  const weekStart = getWeekStart(date)
  const weekEnd = getWeekEnd(date)
  const year = getYear(weekStart)
  const weekNumber = getWeekNumber(weekStart)

  // Try to find existing week
  let planningWeek = await prisma.planningWeek.findUnique({
    where: { year_weekNumber: { year, weekNumber } },
  })

  if (!planningWeek) {
    // Create new week
    planningWeek = await prisma.planningWeek.create({
      data: {
        weekStart,
        weekEnd,
        year,
        weekNumber,
      },
    })
  }

  return planningWeek
}

// Get current planning week
export async function getCurrentPlanningWeek() {
  const now = new Date()
  return getOrCreatePlanningWeek(now)
}

// Get upcoming weeks (current + next N weeks)
export async function getUpcomingWeeks(count: number = 4) {
  const now = new Date()

  // Calculate week ranges for all weeks we need
  const weekRanges = []
  for (let i = 0; i < count; i++) {
    const date = addWeeks(now, i)
    const weekStart = getWeekStart(date)
    const year = getYear(weekStart)
    const weekNumber = getWeekNumber(weekStart)
    weekRanges.push({ year, weekNumber, weekStart, weekEnd: getWeekEnd(date) })
  }

  // Fetch all existing weeks in one query
  const existingWeeks = await prisma.planningWeek.findMany({
    where: {
      OR: weekRanges.map(({ year, weekNumber }) => ({ year, weekNumber }))
    }
  })

  // Create a map of existing weeks by year-weekNumber
  const existingWeeksMap = new Map(
    existingWeeks.map(w => [`${w.year}-${w.weekNumber}`, w])
  )

  // Identify missing weeks
  const missingWeeks = weekRanges.filter(
    ({ year, weekNumber }) => !existingWeeksMap.has(`${year}-${weekNumber}`)
  )

  // Create all missing weeks in one transaction (if any)
  if (missingWeeks.length > 0) {
    await prisma.planningWeek.createMany({
      data: missingWeeks.map(({ year, weekNumber, weekStart, weekEnd }) => ({
        year,
        weekNumber,
        weekStart,
        weekEnd,
      })),
      skipDuplicates: true,
    })

    // Fetch the newly created weeks
    const newWeeks = await prisma.planningWeek.findMany({
      where: {
        OR: missingWeeks.map(({ year, weekNumber }) => ({ year, weekNumber }))
      }
    })

    // Add them to the map
    newWeeks.forEach(w => existingWeeksMap.set(`${w.year}-${w.weekNumber}`, w))
  }

  // Return weeks in the correct order
  return weekRanges.map(({ year, weekNumber }) =>
    existingWeeksMap.get(`${year}-${weekNumber}`)!
  )
}

// Mark a week as current
export async function setCurrentWeek(weekId: string) {
  // Remove current flag from all weeks
  await prisma.planningWeek.updateMany({
    where: { isCurrent: true },
    data: { isCurrent: false },
  })

  // Set the new current week
  return prisma.planningWeek.update({
    where: { id: weekId },
    data: { isCurrent: true },
  })
}

// Lock a week (prevent edits)
export async function lockWeek(weekId: string) {
  return prisma.planningWeek.update({
    where: { id: weekId },
    data: { isLocked: true },
  })
}
