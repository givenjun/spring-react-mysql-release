// src/components/Rolling/RollingNumber.tsx
import React, { useEffect, useRef } from 'react'
import './style.css'

interface RollingNumberProps {
  value: number
  type?: 'slide' | 'normal'
  speed?: number
  delay?: number
  className?: string
}
// 테스트 입력
export default function RollingNumber({
  value,
  type = 'slide',
  speed = 200,
  delay = 300,
  className = '',
}: RollingNumberProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevValueRef = useRef<number>(value)

  useEffect(() => {
    const el = containerRef.current!
    const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const currArr = fmt(value).split('')
    const prevArr = fmt(prevValueRef.current).split('')
    const pad = currArr.length - prevArr.length
    const alignedPrev = pad > 0
      ? Array(pad).fill('0').concat(prevArr)
      : prevArr.slice(-currArr.length)

    // 마지막 자리 롤오버인지 체크 (증가/감소 모두)
    const lastIdx = currArr.length - 1
    const prevLast = Number(alignedPrev[lastIdx])
    const currLast = Number(currArr[lastIdx])
    const upDeltaLast = (currLast - prevLast + 10) % 10
    const downDeltaLast = (prevLast - currLast + 10) % 10
    const isRollover = upDeltaLast === 1 && prevLast > currLast   // 9→0
                     || downDeltaLast === 1 && prevLast < currLast // 0→9

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
      const upDelta = (target - start + 10) % 10
      const downDelta = (start - target + 10) % 10

      // 롤오버일 땐 지연 없이, 아니면 자리별 delay
      const digitDelay = isRollover ? 0 : delay * idx

      const span = document.createElement('span')
      span.className = `num num-${idx}`
      span.setAttribute('data-text', char)
      const list = document.createElement('span')
      list.className = 'num-list'
      list.textContent = '0 1 2 3 4 5 6 7 8 9'
      span.appendChild(list)
      el.appendChild(span)

      // 초기 위치 세팅
      list.style.transition = 'none'
      list.style.marginTop = `-${start * 30}px`
      list.getBoundingClientRect()

      setTimeout(() => {
        if (type !== 'slide') {
          list.style.marginTop = `-${target * 30}px`
          return
        }

        // 변화 없으면 그대로
        if (upDelta === 0 && downDelta === 0) return

        // 증가 방향 우선
        if (upDelta <= downDelta) {
          // 한 칸
          if (upDelta === 1) {
            list.style.transition = `margin ${speed}ms ease`
            list.getBoundingClientRect()
            list.style.marginTop = `-${target * 30}px`
          } else {
            let n = start
            const iv = setInterval(() => {
              list.style.transition = 'none'
              n = (n + 1) % 10
              list.style.marginTop = `-${n * 30}px`
              if (n === target) {
                clearInterval(iv)
                list.style.transition = `margin ${speed}ms ease`
              }
            }, speed)
          }
        } else {
          // 감소 방향
          if (downDelta === 1) {
            list.style.transition = `margin ${speed}ms ease`
            list.getBoundingClientRect()
            list.style.marginTop = `-${target * 30}px`
          } else {
            let n = start
            const iv = setInterval(() => {
              list.style.transition = 'none'
              n = (n - 1 + 10) % 10
              list.style.marginTop = `-${n * 30}px`
              if (n === target) {
                clearInterval(iv)
                list.style.transition = `margin ${speed}ms ease`
              }
            }, speed)
          }
        }
      }, digitDelay)
    })

    prevValueRef.current = value
  }, [value, type, speed, delay])

  return <div ref={containerRef} className={className}></div>
}