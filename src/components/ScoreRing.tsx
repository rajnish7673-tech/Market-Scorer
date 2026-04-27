'use client'
import { useEffect, useState } from 'react'

interface Props { score: number; size?: number }

export default function ScoreRing({ score, size = 130 }: Props) {
  const [animated, setAnimated] = useState(0)
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (animated / 100) * circ

  const color =
    score >= 75 ? '#0FA958' :
    score >= 50 ? '#D97706' : '#E53E3E'

  const grade =
    score >= 85 ? 'A+' : score >= 75 ? 'A' :
    score >= 65 ? 'B+' : score >= 55 ? 'B' :
    score >= 45 ? 'C' : 'D'

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EEEEF4" strokeWidth={10} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 600, color, lineHeight: 1 }}>{animated}</span>
        <span style={{ fontSize: size * 0.12, color: '#6B6B8A', marginTop: 2 }}>/100</span>
        <span style={{
          fontSize: size * 0.14, fontWeight: 700, color,
          background: color + '18', borderRadius: 99,
          padding: '1px 8px', marginTop: 4
        }}>{grade}</span>
      </div>
    </div>
  )
}
