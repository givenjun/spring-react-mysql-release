// src/components/Rolling/RollingNumber.tsx
import React, { useEffect, useRef, useState } from 'react'
import './style.css'

interface RollingNumberProps {
  value: number
  initVal?: number
  type?: 'slide' | 'normal'
  speed?: number
  delay?: number
  className?: string
}

export default function RollingNumber({
  value,
  initVal,
  type = 'slide',
  speed = 200,
  delay = 300,
  className = '',
}: RollingNumberProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevValueRef = useRef<number>(initVal ?? value)
  const [animatedValue, setAnimatedValue] = useState<number>(initVal ?? value)
  const [hasAnimated, setHasAnimated] = useState(false)

  // 🔄 초기 애니메이션: 0 → value로 자연스럽게 증가
  useEffect(() => {
    if (hasAnimated || initVal === undefined || initVal === value) {
      setAnimatedValue(value)
      return
    }
    
    let current = initVal
    // const step = Math.ceil((value - initVal) / (value / 13))
    const step = 1
    const interval = setInterval(() => {
      current += step
      if (current >= value) {
        current = value
        clearInterval(interval)
        setHasAnimated(true)
      }
      setAnimatedValue(current)
    }, 0)

    return () => clearInterval(interval)
  }, [initVal, value, hasAnimated])

  // 🔄 숫자 롤링 애니메이션
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const currArr = fmt(animatedValue).split('')
    const prevArr = fmt(prevValueRef.current).split('')
    const pad = currArr.length - prevArr.length
    const alignedPrev = pad > 0
      ? Array(pad).fill('0').concat(prevArr)
      : prevArr.slice(-currArr.length)

    el.innerHTML = ''

    currArr.forEach((char, idx) => {
      if (char === ',') {
        const comma = document.createElement('span')
        comma.className = 'num point'
        comma.textContent = ','
        el.appendChild(comma)
        return
      }

      const start = Number(alignedPrev[idx])
      const target = Number(char)
      const span = document.createElement('span')
      span.className = `num num-${idx}`
      span.setAttribute('data-text', char)

      const list = document.createElement('span')
      list.className = 'num-list'
      list.textContent = '0 1 2 3 4 5 6 7 8 9'

      span.appendChild(list)
      el.appendChild(span)

      list.style.transition = 'none'
      list.style.marginTop = `-${start * 30}px`
      list.getBoundingClientRect()

      setTimeout(() => {
        if (type !== 'slide') {
          list.style.marginTop = `-${target * 30}px`
        } else {
          list.style.transition = `margin ${speed}ms ease`
          list.style.marginTop = `-${target * 30}px`
        }
      }, delay * idx)
    })

    prevValueRef.current = animatedValue
  }, [animatedValue, type, speed, delay])

  return <div ref={containerRef} className={className}></div>
}
