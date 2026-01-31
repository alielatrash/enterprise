'use client'

import { useEffect } from 'react'

// Pings the database every 4 minutes to prevent cold starts
// Neon free tier suspends after 5 minutes of inactivity
export function DatabaseKeepAlive() {
  useEffect(() => {
    // Ping immediately on mount
    fetch('/api/keep-alive').catch(() => {})

    // Then ping every 4 minutes (240 seconds)
    const interval = setInterval(() => {
      fetch('/api/keep-alive').catch(() => {})
    }, 4 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
