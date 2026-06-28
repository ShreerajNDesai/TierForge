import React, { useRef, useEffect, HTMLAttributes } from 'react'

interface TransientScrollProps extends HTMLAttributes<HTMLDivElement> {
  timeoutMs?: number
  children: React.ReactNode
}

export const TransientScroll: React.FC<TransientScrollProps> = ({
  timeoutMs = 800,
  children,
  className = '',
  onScroll,
  ...props
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      el.classList.add('is-scrolling')

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

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

  return (
    <div
      ref={scrollRef}
      className={`${className}`}
      onScroll={onScroll}
      {...props}
    >
      {children}
    </div>
  )
}
