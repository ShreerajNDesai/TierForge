import { useEffect, useRef } from 'react'

export function useTransientScroll(timeoutMs: number = 800) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      // Add the scrolling class
      el.classList.add('is-scrolling')

      // Clear existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      // Set new timer to remove the class after scrolling stops
      timerRef.current = setTimeout(() => {
        el.classList.remove('is-scrolling')
      }, timeoutMs)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      el.removeEventListener('scroll', handleScroll)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timeoutMs])

  return scrollRef
}
