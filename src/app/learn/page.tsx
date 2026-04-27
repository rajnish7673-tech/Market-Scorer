'use client'
import { useState, useMemo } from 'react'
import { Search, ChevronLeft, TrendingUp, DollarSign, BarChart2, BookOpen, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts'
import {
  MF_TERMS, STOCK_TERMS,
  MF_CATEGORIES, STOCK_CATEGORIES,
  MF_BEGINNER_STEPS, STOCK_BEGINNER_STEPS,
  type Term,
} from './learn-data'

type Tab = 'mf' | 'stocks'

const CAT_COLORS: Record<string, string> = {
  Basics: '#4F3FFF',
  Returns: '#0FA958',
  Risk: '#E53E3E',
  Cost: '#D97706',
  'Reading Market': '#0FA958',
  'Company Analysis': '#4F3FFF',
  Trading: '#D97706',
  'Risk & Tax': '#E53E3E',
}

// ── Deterministic volatility simulation ──────────────────────────────────────
function makeVolData(vol: number) {
  return Array.from({ length: 48 }, (_, i) => {
    const trend = 100 + i * 0.35
    const wave = Math.sin(i * 0.35) * vol * 0.55 + Math.sin(i * 0.8 + 1.2) * vol * 0.25
    return { month: i + 1, nav: parseFloat(Math.max(70, trend + wave).toFixed(2)) }
  })
}

// ── Term Card ────────────────────────────────────────────────────────────────
function TermCard({ term, expanded, onToggle }: { term: Term; expanded: boolean; onToggle: () => void }) {
  const catColor = CAT_COLORS[term.category] ?? '#4F3FFF'
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
      {/* Always visible header */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0, flex: 1 }}>{term.name}</h3>
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#fff', background: catColor,
            borderRadius: 4, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{term.category}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.55 }}>{term.definition}</p>
        <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--ink)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
            💡 {term.analogy}
          </p>
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, color: catColor, padding: 0,
          }}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Show less' : 'See example & how to use'}
        </button>
      </div>

      {/* Expandable deep content */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', background: 'var(--surface)' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: catColor, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
              Real Example
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink)', margin: 0, lineHeight: 1.6, background: 'var(--white)', borderRadius: 8, padding: '10px 12px' }}>
              {term.example}
            </p>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0FA958', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
              How to use in real life
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink)', margin: 0, lineHeight: 1.6, background: 'var(--white)', borderRadius: 8, padding: '10px 12px' }}>
              {term.realLifeUse}
            </p>
          </div>

          {term.correlation && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4F3FFF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                How it connects to other metrics
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink)', margin: 0, lineHeight: 1.6, background: 'var(--white)', borderRadius: 8, padding: '10px 12px' }}>
                {term.correlation}
              </p>
            </div>
          )}

          {term.watchOut && (
            <div style={{ marginBottom: 12, background: '#FEF3CD', borderRadius: 8, padding: '10px 12px', borderLeft: '3px solid #D97706' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', marginBottom: 4 }}>⚠ Watch Out</div>
              <p style={{ fontSize: 12, color: '#854F0B', margin: 0, lineHeight: 1.55 }}>{term.watchOut}</p>
            </div>
          )}

          {term.goodRange && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Good Range</div>
              <p style={{ fontSize: 12, color: 'var(--ink)', margin: 0 }}>{term.goodRange}</p>
            </div>
          )}

          {term.relatedTerms && term.relatedTerms.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {term.relatedTerms.map(r => (
                <span key={r} style={{ fontSize: 10, color: catColor, background: `${catColor}15`, borderRadius: 4, padding: '4px 8px' }}>
                  → {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: sub ? 4 : 14 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#4F3FFF18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{title}</h3>
        {sub && <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>{sub}</p>}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<Tab>('mf')
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set())
  const [showGuide, setShowGuide] = useState(false)

  // MF interactive state
  const [sipAmount, setSipAmount] = useState(5000)
  const [sipYears, setSipYears] = useState(10)
  const [sipCagr, setSipCagr] = useState(12)
  const [investment, setInvestment] = useState(500000)
  const [erYears, setErYears] = useState(15)

  // Stock interactive state
  const [stockEPS, setStockEPS] = useState(70)
  const [stockPE, setStockPE] = useState(22)
  const [gainPct, setGainPct] = useState(30)
  const [tradeAmt, setTradeAmt] = useState(100000)

  // Volatility demo (shared, shown on MF tab)
  const [volatility, setVolatility] = useState(14)

  const volData = useMemo(() => makeVolData(volatility), [volatility])

  const sipData = useMemo(() => Array.from({ length: sipYears * 12 }, (_, i) => {
    const months = i + 1
    const r = (1 + sipCagr / 100) ** (1 / 12) - 1
    const fv = sipAmount * (((1 + r) ** months - 1) / r) * (1 + r)
    return { month: months, value: Math.round(fv), invested: sipAmount * months }
  }), [sipAmount, sipYears, sipCagr])

  const erData = useMemo(() => [
    { label: 'Direct 0.5%', er: 0.5, value: Math.round(investment * Math.pow(1 + (12 - 0.5) / 100, erYears)), color: '#0FA958' },
    { label: 'Good 1%', er: 1.0, value: Math.round(investment * Math.pow(1 + (12 - 1) / 100, erYears)), color: '#4F3FFF' },
    { label: 'Avg 1.5%', er: 1.5, value: Math.round(investment * Math.pow(1 + (12 - 1.5) / 100, erYears)), color: '#D97706' },
    { label: 'High 2%', er: 2.0, value: Math.round(investment * Math.pow(1 + (12 - 2) / 100, erYears)), color: '#E53E3E' },
  ], [investment, erYears])

  // PE valuation data
  const peData = useMemo(() => [10, 15, 20, 25, 30, 35, 40].map(pe => ({
    pe, price: stockEPS * pe,
    highlight: pe === stockPE,
  })), [stockEPS, stockPE])

  // Tax comparison
  const taxData = useMemo(() => {
    const gain = tradeAmt * gainPct / 100
    const stcg = gain * 0.20
    const ltcg = gain > 125000 ? (gain - 125000) * 0.125 : 0
    return { gain: Math.round(gain), stcg: Math.round(stcg), ltcg: Math.round(ltcg), saved: Math.round(stcg - ltcg) }
  }, [tradeAmt, gainPct])

  const terms = activeTab === 'mf' ? MF_TERMS : STOCK_TERMS
  const categories = activeTab === 'mf' ? MF_CATEGORIES : STOCK_CATEGORIES
  const steps = activeTab === 'mf' ? MF_BEGINNER_STEPS : STOCK_BEGINNER_STEPS

  const filtered = useMemo(() => terms.filter(t => {
    const q = query.toLowerCase()
    const matchQ = !q || t.name.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q) || t.analogy.toLowerCase().includes(q) || t.example.toLowerCase().includes(q)
    const matchC = selectedCategory === 'All' || t.category === selectedCategory
    return matchQ && matchC
  }), [terms, query, selectedCategory])

  function toggleTerm(id: string) {
    setExpandedTerms(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab)
    setQuery('')
    setSelectedCategory('All')
    setExpandedTerms(new Set())
    setShowGuide(false)
  }

  const showDemos = selectedCategory === 'All' && query.length === 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{ background: 'var(--ink-2)', padding: '0 16px', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #ffffff10' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', height: 52, gap: 10 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', width: 28, height: 28, color: '#fff' }}>
            <ChevronLeft size={20} />
          </Link>
          <BookOpen size={16} color="#4F3FFF" />
          <span className="font-display" style={{ fontSize: 17, color: '#fff', letterSpacing: '-.01em' }}>
            {activeTab === 'mf' ? 'Mutual Fund Guide' : 'Stock Market Guide'}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 100px' }}>

        {/* Tab Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, background: 'var(--white)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
          {([['mf', 'Mutual Funds'], ['stocks', 'Stock Market']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              style={{
                padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: activeTab === tab ? '#4F3FFF' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--muted)',
                transition: 'background 200ms',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--white)', border: '1.5px solid var(--border-2)', borderRadius: 12, padding: '0 12px', height: 44, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <Search size={16} color="var(--muted)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'mf' ? 'MF' : 'stock'} terms, analogies…`}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--ink)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, padding: 0 }}>✕</button>
          )}
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {(['All', ...categories] as string[]).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                background: selectedCategory === cat ? (CAT_COLORS[cat] ?? '#4F3FFF') : 'var(--white)',
                color: selectedCategory === cat ? '#fff' : 'var(--muted)',
                boxShadow: selectedCategory === cat ? `0 2px 8px ${CAT_COLORS[cat] ?? '#4F3FFF'}50` : '0 1px 3px rgba(0,0,0,.06)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Beginner Guide */}
        {showDemos && (
          <div className="card" style={{ padding: 0, marginBottom: 12, overflow: 'hidden' }}>
            <button
              onClick={() => setShowGuide(g => !g)}
              style={{
                width: '100%', background: 'linear-gradient(135deg, var(--ink-2) 0%, var(--ink-3) 100%)',
                border: 'none', cursor: 'pointer', padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} color="#0FA958" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    {activeTab === 'mf' ? 'How to Start Investing in MF' : 'How to Start in Stock Market'}
                  </div>
                  <div style={{ fontSize: 11, color: '#ffffff70' }}>
                    {steps.length}-step beginner guide
                  </div>
                </div>
              </div>
              {showGuide ? <ChevronUp size={16} color="#fff" /> : <ChevronDown size={16} color="#fff" />}
            </button>
            {showGuide && (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {steps.map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 99, background: '#4F3FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{s.step}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MF Interactive Demos ─────────────────────────────────────────── */}
        {showDemos && activeTab === 'mf' && (
          <div style={{ marginBottom: 4 }}>
            {/* SIP Growth */}
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <SectionTitle icon={<TrendingUp size={16} color="#4F3FFF" />} title="SIP Compounding Simulator" sub="Drag sliders to see how your monthly SIP grows" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Monthly SIP', val: `₹${sipAmount.toLocaleString()}`, min: 500, max: 50000, step: 500, setter: setSipAmount, current: sipAmount },
                  { label: 'Duration (yrs)', val: `${sipYears}Y`, min: 1, max: 30, step: 1, setter: setSipYears, current: sipYears },
                  { label: 'Annual Return', val: `${sipCagr}%`, min: 5, max: 25, step: 1, setter: setSipCagr, current: sipCagr },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>{item.label}</div>
                    <input type="range" min={item.min} max={item.max} step={item.step} value={item.current}
                      onChange={e => item.setter(Number(e.target.value))} style={{ width: '100%', accentColor: '#4F3FFF' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#4F3FFF', marginTop: 2 }}>{item.val}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={sipData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sipG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F3FFF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4F3FFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="invG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} tickFormatter={m => `${Math.round(m / 12)}Y`} interval={Math.floor(sipYears * 12 / 5)} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v: number) => [`₹${(v / 100000).toFixed(2)}L`]} />
                  <Area type="monotone" dataKey="invested" stroke="#94A3B8" strokeWidth={1.5} fill="url(#invG)" dot={false} name="Invested" />
                  <Area type="monotone" dataKey="value" stroke="#4F3FFF" strokeWidth={2} fill="url(#sipG)" dot={false} name="Portfolio Value" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                {[
                  { label: 'INVESTED', val: `₹${(sipAmount * sipYears * 12 / 100000).toFixed(1)}L`, color: '#64748B' },
                  { label: 'FINAL VALUE', val: `₹${((sipData.at(-1)?.value ?? 0) / 100000).toFixed(1)}L`, color: '#0FA958' },
                  { label: 'WEALTH GAINED', val: `₹${(((sipData.at(-1)?.value ?? 0) - sipAmount * sipYears * 12) / 100000).toFixed(1)}L`, color: '#4F3FFF' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Volatility Demo */}
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <SectionTitle icon={<BarChart2 size={16} color="#4F3FFF" />} title="Volatility Visualizer" sub="What different risk levels feel like as an investor" />
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>Annual Volatility: {volatility}%</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: volatility < 12 ? '#0FA958' : volatility < 20 ? '#D97706' : '#E53E3E' }}>
                    {volatility < 12 ? 'Low Risk' : volatility < 20 ? 'Moderate Risk' : volatility < 30 ? 'High Risk' : 'Very High Risk'}
                  </span>
                </div>
                <input type="range" min="3" max="40" step="1" value={volatility} onChange={e => setVolatility(Number(e.target.value))} style={{ width: '100%', accentColor: volatility < 12 ? '#0FA958' : volatility < 20 ? '#D97706' : '#E53E3E' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, marginTop: 8 }}>
                  {[['Under 14%', 'Liquid/Debt', '#0FA958'], ['14–20%', 'Large cap', '#4F3FFF'], ['20–28%', 'Mid cap', '#D97706'], ['Above 28%', 'Small cap', '#E53E3E']].map(([range, label, color]) => (
                    <div key={range} style={{ background: 'var(--surface)', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color }}>{range}</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={volData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={volatility < 14 ? '#0FA958' : volatility < 20 ? '#4F3FFF' : '#E53E3E'} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={volatility < 14 ? '#0FA958' : volatility < 20 ? '#4F3FFF' : '#E53E3E'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: number) => [`₹${v.toFixed(2)}`]} labelFormatter={m => `Month ${m}`} />
                  <Area type="monotone" dataKey="nav" stroke={volatility < 14 ? '#0FA958' : volatility < 20 ? '#4F3FFF' : '#E53E3E'} strokeWidth={2} fill="url(#volG)" dot={false} name="NAV" />
                </AreaChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.6 }}>
                {volatility < 12 ? '😌 You\'d barely notice this fund in your portfolio. Ideal for short-term goals.' :
                  volatility < 20 ? '🙂 Occasional dips but generally steady. Good for 5Y+ goals.' :
                  volatility < 28 ? '😬 Significant monthly swings. You need conviction AND a 7Y+ horizon.' :
                  '😰 Wild swings. Only for investors who truly understand what they own. 10Y+ minimum.'}
              </p>
            </div>

            {/* Expense Ratio Impact */}
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <SectionTitle icon={<DollarSign size={16} color="#4F3FFF" />} title="Expense Ratio Wealth Killer" sub="See how small % fees compound into massive losses" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Lump Sum Investment</div>
                  <input type="range" min="100000" max="2000000" step="50000" value={investment} onChange={e => setInvestment(Number(e.target.value))} style={{ width: '100%', accentColor: '#4F3FFF' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4F3FFF', marginTop: 2 }}>₹{(investment / 100000).toFixed(1)}L</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Time Horizon</div>
                  <input type="range" min="1" max="30" step="1" value={erYears} onChange={e => setErYears(Number(e.target.value))} style={{ width: '100%', accentColor: '#4F3FFF' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4F3FFF', marginTop: 2 }}>{erYears} years</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {erData.map(item => (
                  <div key={item.label} style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px', borderLeft: `4px solid ${item.color}` }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>₹{(item.value / 100000).toFixed(1)}L</div>
                    {item.er > 0.5 && (
                      <div style={{ fontSize: 9, color: '#E53E3E', marginTop: 3 }}>
                        Lost: ₹{((erData[0].value - item.value) / 100000).toFixed(1)}L vs Direct
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ background: '#FEF3CD', borderRadius: 8, padding: '10px 12px', borderLeft: '3px solid #D97706' }}>
                <p style={{ fontSize: 11, color: '#854F0B', margin: 0, lineHeight: 1.6 }}>
                  💡 On ₹{(investment / 100000).toFixed(1)}L over {erYears}Y, choosing Regular plan (2% ER) vs Direct (0.5% ER) costs you <strong>₹{((erData[0].value - erData[3].value) / 100000).toFixed(1)} lakhs</strong> — enough to fund years of retirement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Stock Interactive Demos ────────────────────────────────────── */}
        {showDemos && activeTab === 'stocks' && (
          <div style={{ marginBottom: 4 }}>
            {/* PE Valuation Demo */}
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <SectionTitle icon={<BarChart2 size={16} color="#4F3FFF" />} title="PE Ratio Valuation Tool" sub="See how PE × EPS drives stock price" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>EPS (₹ annual profit per share)</div>
                  <input type="range" min="10" max="300" step="5" value={stockEPS} onChange={e => setStockEPS(Number(e.target.value))} style={{ width: '100%', accentColor: '#4F3FFF' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4F3FFF', marginTop: 2 }}>₹{stockEPS}/share</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>PE Multiple (market is willing to pay)</div>
                  <input type="range" min="5" max="60" step="1" value={stockPE} onChange={e => setStockPE(Number(e.target.value))} style={{ width: '100%', accentColor: stockPE < 15 ? '#0FA958' : stockPE < 30 ? '#4F3FFF' : '#E53E3E' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: stockPE < 15 ? '#0FA958' : stockPE < 30 ? '#4F3FFF' : '#E53E3E', marginTop: 2 }}>
                    {stockPE}x — {stockPE < 12 ? 'Cheap (value zone)' : stockPE < 20 ? 'Fair Value' : stockPE < 30 ? 'Moderate premium' : stockPE < 40 ? 'Expensive' : 'Very expensive'}
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--ink-2)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#ffffff70', marginBottom: 4 }}>CURRENT STOCK PRICE = EPS × PE</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>₹{(stockEPS * stockPE).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#ffffff70', marginTop: 4 }}>₹{stockEPS} EPS × {stockPE} PE = ₹{(stockEPS * stockPE).toLocaleString()}/share</div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={peData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="pe" tick={{ fontSize: 9 }} label={{ value: 'PE Multiple', position: 'insideBottomRight', offset: -8, fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`]} labelFormatter={pe => `PE ${pe}x`} />
                  <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                    {peData.map((entry, i) => (
                      <Cell key={i} fill={entry.highlight ? '#4F3FFF' : entry.pe < 15 ? '#0FA958' : entry.pe < 30 ? '#94A3B8' : '#E53E3E'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.6 }}>
                If EPS grows 20% next year (₹{stockEPS} → ₹{Math.round(stockEPS * 1.2)}) AND PE stays same ({stockPE}x), stock goes from ₹{stockEPS * stockPE} to ₹{Math.round(stockEPS * 1.2 * stockPE)} — a {20}% gain purely from earnings growth.
              </p>
            </div>

            {/* Tax Saver Demo */}
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <SectionTitle icon={<DollarSign size={16} color="#4F3FFF" />} title="STCG vs LTCG Tax Saver" sub="How waiting 1 year can save lakhs in tax" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Investment Amount</div>
                  <input type="range" min="50000" max="2000000" step="25000" value={tradeAmt} onChange={e => setTradeAmt(Number(e.target.value))} style={{ width: '100%', accentColor: '#4F3FFF' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4F3FFF', marginTop: 2 }}>₹{(tradeAmt / 100000).toFixed(1)}L</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Profit %</div>
                  <input type="range" min="5" max="100" step="5" value={gainPct} onChange={e => setGainPct(Number(e.target.value))} style={{ width: '100%', accentColor: '#0FA958' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0FA958', marginTop: 2 }}>+{gainPct}% profit</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: '#FEE8E8', borderRadius: 8, padding: '10px 12px', borderLeft: '3px solid #E53E3E' }}>
                  <div style={{ fontSize: 9, color: '#E53E3E', fontWeight: 700, marginBottom: 4 }}>STCG (under 1 yr) — 20%</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#E53E3E' }}>₹{(taxData.stcg / 100000).toFixed(2)}L tax</div>
                  <div style={{ fontSize: 10, color: '#E53E3E', marginTop: 3 }}>on ₹{(taxData.gain / 100000).toFixed(2)}L profit</div>
                </div>
                <div style={{ background: '#E8FEF3', borderRadius: 8, padding: '10px 12px', borderLeft: '3px solid #0FA958' }}>
                  <div style={{ fontSize: 9, color: '#0FA958', fontWeight: 700, marginBottom: 4 }}>LTCG (after 1 yr) — 12.5%</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0FA958' }}>₹{(taxData.ltcg / 100000).toFixed(2)}L tax</div>
                  <div style={{ fontSize: 10, color: '#0FA958', marginTop: 3 }}>₹1.25L exemption applied</div>
                </div>
                <div style={{ background: '#EEF0FF', borderRadius: 8, padding: '10px 12px', borderLeft: '3px solid #4F3FFF' }}>
                  <div style={{ fontSize: 9, color: '#4F3FFF', fontWeight: 700, marginBottom: 4 }}>TAX SAVED by waiting</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#4F3FFF' }}>₹{(taxData.saved / 100000).toFixed(2)}L</div>
                  <div style={{ fontSize: 10, color: '#4F3FFF', marginTop: 3 }}>by holding 1+ year</div>
                </div>
              </div>
              <div style={{ background: '#E8FEF3', borderRadius: 8, padding: '10px 12px', borderLeft: '3px solid #0FA958' }}>
                <p style={{ fontSize: 11, color: '#0A6636', margin: 0, lineHeight: 1.6 }}>
                  💡 Selling ₹{(tradeAmt / 100000).toFixed(1)}L investment after 1 year instead of 11 months saves ₹{(taxData.saved / 100000).toFixed(2)} lakhs in tax. That money stays invested and compounds further.
                </p>
              </div>
            </div>

            {/* Compounding Demo */}
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <SectionTitle icon={<TrendingUp size={16} color="#4F3FFF" />} title="The Power of Staying Invested" sub="Comparing long-term holding vs frequent trading" />
              {(() => {
                const amount = 100000
                const longTermData = Array.from({ length: 20 }, (_, i) => ({
                  year: i + 1,
                  holding: Math.round(amount * Math.pow(1.14, i + 1)),
                  trading: Math.round(amount * Math.pow(1.14 * (1 - 0.20), i + 1)),
                }))
                return (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={longTermData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="holdG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0FA958" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0FA958" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="tradeG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#E53E3E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="year" tick={{ fontSize: 9 }} label={{ value: 'Years', position: 'insideBottomRight', offset: -8, fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                        <Tooltip formatter={(v: number) => [`₹${(v / 100000).toFixed(2)}L`]} />
                        <Area type="monotone" dataKey="holding" stroke="#0FA958" strokeWidth={2} fill="url(#holdG)" name="Hold (LTCG 12.5%)" />
                        <Area type="monotone" dataKey="trading" stroke="#E53E3E" strokeWidth={2} fill="url(#tradeG)" name="Trade annually (STCG 20%)" />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                      {[
                        { label: 'BUY & HOLD 20Y (LTCG)', val: `₹${(longTermData.at(-1)!.holding / 100000).toFixed(1)}L`, color: '#0FA958' },
                        { label: 'TRADE EVERY YEAR (STCG)', val: `₹${(longTermData.at(-1)!.trading / 100000).toFixed(1)}L`, color: '#E53E3E' },
                      ].map(item => (
                        <div key={item.label} style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.6 }}>
                      Starting with ₹1L at 14% annual return: Buy-and-hold for 20Y = ₹{(longTermData.at(-1)!.holding / 100000).toFixed(1)}L. Trading annually and paying 20% STCG each time = only ₹{(longTermData.at(-1)!.trading / 100000).toFixed(1)}L. Patience is worth ₹{((longTermData.at(-1)!.holding - longTermData.at(-1)!.trading) / 100000).toFixed(1)}L.
                    </p>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Terms Count */}
        {query.length > 0 && (
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
            {filtered.length} term{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Terms Grid */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(term => (
              <TermCard
                key={term.id}
                term={term}
                expanded={expandedTerms.has(term.id)}
                onToggle={() => toggleTerm(term.id)}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>No terms found for "{query}"</p>
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F3FFF', fontSize: 12, marginTop: 8 }}>Clear search</button>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, padding: 16, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, color: 'var(--muted-2)', margin: 0, lineHeight: 1.6 }}>
            <strong>📚 FundIQ Learn:</strong> Educational content for reference only. Not financial advice. Consult a SEBI-registered advisor before investing. All examples use historical data and approximate figures.
          </p>
        </div>
      </div>
    </div>
  )
}
