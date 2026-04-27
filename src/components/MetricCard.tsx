interface Props {
  label: string
  value: string | number
  sub?: string
  color?: 'green' | 'red' | 'amber' | 'blue' | 'violet' | 'default'
  suffix?: string
  prefix?: string
}

const colors = {
  green:   { val: '#0FA958', bg: '#E6F7EE' },
  red:     { val: '#E53E3E', bg: '#FEE8E8' },
  amber:   { val: '#D97706', bg: '#FEF3CD' },
  blue:    { val: '#2563EB', bg: '#EBF2FF' },
  violet:  { val: '#6D28D9', bg: '#EDE9FE' },
  default: { val: '#0D0D14', bg: '#F4F4F8' },
}

export default function MetricCard({ label, value, sub, color = 'default', suffix, prefix }: Props) {
  const c = colors[color]
  return (
    <div className="card-sm" style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        {prefix && <span style={{ fontSize: 13, color: c.val, fontWeight: 500 }}>{prefix}</span>}
        <span style={{ fontSize: 22, fontWeight: 600, color: c.val, lineHeight: 1.2 }}>{value}</span>
        {suffix && <span style={{ fontSize: 13, color: c.val, fontWeight: 500 }}>{suffix}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}
