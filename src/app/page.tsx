'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  Search, TrendingUp, TrendingDown, Shield, DollarSign,
  BarChart2, Info, ChevronRight, CheckCircle, AlertTriangle,
  XCircle, Loader2, Clock,
} from 'lucide-react'
import { searchFunds, analyseFund, getAllSchemes, sipProjection } from '@/lib/scoring'
import type { FundAnalysis, SearchResult } from '@/lib/scoring'
import ScoreRing from '@/components/ScoreRing'
import MetricCard from '@/components/MetricCard'
import BottomNav from '@/components/BottomNav'

function fmt(n: number, d = 1) { return n.toFixed(d) }
function fmtDate(d: string) {
  const [dd, mm, yy] = d.split('-')
  return `${dd}/${mm}/${yy}`
}
function scoreColor(s: number) {
  return s >= 75 ? '#0FA958' : s >= 50 ? '#D97706' : '#E53E3E'
}

function NavTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-sm" style={{ padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{fmtDate(label)}</div>
      <div style={{ fontWeight: 600 }}>₹ {payload[0].value.toFixed(2)}</div>
    </div>
  )
}
function RollingTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="card-sm" style={{ padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{fmtDate(label)}</div>
      <div style={{ fontWeight: 600, color: v >= 0 ? '#0FA958' : '#E53E3E' }}>
        {v >= 0 ? '+' : ''}{v.toFixed(1)}% CAGR
      </div>
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: '#4F3FFF18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#4F3FFF' }}>{icon}</span>
      </div>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{title}</h2>
    </div>
  )
}

interface RecentFund { schemeCode: number; schemeName: string; grade: string; totalScore: number }

export default function Home() {
  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState<SearchResult[]>([])
  const [searching, setSearching]     = useState(false)
  const [loading, setLoading]         = useState(false)
  const [analysis, setAnalysis]       = useState<FundAnalysis | null>(null)
  const [error, setError]             = useState('')
  const [showResults, setShowResults] = useState(false)
  const [schemeStatus, setSchemeStatus] = useState<'idle' | 'loading' | 'ready'>('idle')
  const [recentFunds, setRecentFunds] = useState<RecentFund[]>([])
  const [sipMonth, setSipMonth]       = useState(5000)
  const [sipYears, setSipYears]       = useState(10)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load recent funds from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('fundiq_recent')
    if (stored) {
      try {
        setRecentFunds(JSON.parse(stored))
      } catch (e) {}
    }
  }, [])

  // Save recent funds when analysis changes
  useEffect(() => {
    if (analysis) {
      const fund: RecentFund = {
        schemeCode: analysis.schemeCode,
        schemeName: analysis.name,
        grade: analysis.grade,
        totalScore: analysis.totalScore,
      }
      setRecentFunds(prev => {
        const filtered = prev.filter(f => f.schemeCode !== fund.schemeCode)
        const updated = [fund, ...filtered].slice(0, 5)
        localStorage.setItem('fundiq_recent', JSON.stringify(updated))
        return updated
      })
    }
  }, [analysis])

  // Pre-warm the scheme list on first keystroke so subsequent searches are instant
  const warmSchemes = useCallback(async () => {
    if (schemeStatus !== 'idle') return
    setSchemeStatus('loading')
    try {
      await getAllSchemes()
      setSchemeStatus('ready')
    } catch {
      setSchemeStatus('idle') // allow retry
    }
  }, [schemeStatus])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setShowResults(false); return }
    setSearching(true)
    try {
      const res = await searchFunds(q)
      setResults(res)
      setShowResults(true)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => doSearch(query), 400)
  }, [query, doSearch])

  async function selectFund(code: number, name: string) {
    setQuery(name)
    setShowResults(false)
    setResults([])
    setLoading(true)
    setError('')
    setAnalysis(null)
    try {
      const a = await analyseFund(code)
      setAnalysis(a)
    } catch (e: any) {
      setError('Could not load fund data. Try searching again or pick a different fund.')
    } finally {
      setLoading(false)
    }
  }

  const a = analysis

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>

      {/* ── Top bar ── */}
      <div style={{
        background: 'var(--ink-2)', padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid #ffffff10',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', height: 52, gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: '#4F3FFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart2 size={15} color="#fff" />
          </div>
          <span className="font-display" style={{ fontSize: 17, color: '#fff', letterSpacing: '-.01em' }}>FundIQ</span>
          <span style={{ fontSize: 11, color: '#ffffff50' }}>MF Scoring Engine</span>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px 80px' }}>

        {/* ── Hero ── */}
        {!a && !loading && (
          <div className="animate-fadeUp" style={{ paddingTop: 40, paddingBottom: 8, textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: 32, lineHeight: 1.15, color: 'var(--ink)', marginBottom: 10 }}>
              Score any mutual fund<br />
              <span style={{ color: '#4F3FFF' }}>in seconds</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 28px', lineHeight: 1.6 }}>
              Auto-fetches NAV history · Calculates CAGR, Sharpe, Alpha,<br />
              Drawdown, Volatility & more · Gives a score out of 100
            </p>
          </div>
        )}

        {a && <div style={{ paddingTop: 16 }} />}

        {/* ── Search ── */}
        <div style={{ position: 'relative', marginBottom: 4 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--white)', border: '1.5px solid var(--border-2)',
            borderRadius: 14, padding: '0 14px', height: 50,
            boxShadow: '0 2px 12px rgba(0,0,0,.06)',
          }}>
            {searching
              ? <Loader2 size={18} color="var(--muted)" className="spin-slow" />
              : <Search size={18} color="var(--muted)" />
            }
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => { warmSchemes(); if (results.length) setShowResults(true) }}
              placeholder="Search fund — e.g. Mirae Asset Large Cap Direct"
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent', fontSize: 14, color: 'var(--ink)',
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setShowResults(false); setAnalysis(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          {/* Scheme list loading hint */}
          {schemeStatus === 'loading' && query.length > 0 && (
            <div style={{
              position: 'absolute', top: 56, left: 0, right: 0, zIndex: 100,
              background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,.08)',
            }}>
              <Loader2 size={14} color="#4F3FFF" className="spin-slow" />
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                Loading ~15,000 fund schemes… (one-time, takes 2–3 sec)
              </span>
            </div>
          )}

          {/* Results dropdown */}
          {showResults && results.length > 0 && (
            <div className="card animate-fadeIn" style={{
              position: 'absolute', top: 56, left: 0, right: 0, zIndex: 100,
              overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.12)',
            }}>
              {results.map((r, i) => (
                <button
                  key={r.schemeCode}
                  onClick={() => selectFund(r.schemeCode, r.schemeName)}
                  style={{
                    width: '100%', border: 'none', background: 'none', cursor: 'pointer',
                    padding: '11px 14px', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <TrendingUp size={13} color="var(--muted)" />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>
                    {r.schemeName}
                  </span>
                  <ChevronRight size={14} color="var(--muted-2)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {showResults && results.length === 0 && !searching && query.length >= 2 && schemeStatus === 'ready' && (
            <div className="card" style={{
              position: 'absolute', top: 56, left: 0, right: 0, zIndex: 100,
              padding: '14px', fontSize: 13, color: 'var(--muted)',
              boxShadow: '0 4px 16px rgba(0,0,0,.08)',
            }}>
              No funds found for "{query}". Try a shorter keyword — e.g. "parag parikh" or "axis bluechip".
            </div>
          )}
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted-2)', margin: '6px 0 0 4px' }}>
          Powered by mfapi.in · Full scheme list fetched once, searched client-side · NAV history fetched per fund
        </p>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <Loader2 size={36} color="#4F3FFF" className="spin-slow" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              Fetching NAV history & calculating all metrics…
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="card" style={{
            padding: 16, marginTop: 16,
            borderColor: '#E53E3E40', background: '#FEE8E8',
          }}>
            <p style={{ margin: 0, color: '#E53E3E', fontSize: 13 }}>{error}</p>
          </div>
        )}

        {/* ════════════════════════════════════════
            DASHBOARD
        ════════════════════════════════════════ */}
        {a && (
          <div style={{ marginTop: 20 }}>

            {/* ── Score hero card ── */}
            <div className="card animate-fadeUp" style={{
              padding: '20px 16px', marginBottom: 12, border: 'none',
              background: 'linear-gradient(135deg, var(--ink-2) 0%, var(--ink-3) 100%)',
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <ScoreRing score={a.totalScore} size={110} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: a.isDirect ? '#0FA95830' : '#D9770630',
                    borderRadius: 99, padding: '2px 8px', marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: a.isDirect ? '#0FA958' : '#D97706' }}>
                      {a.isDirect ? 'DIRECT PLAN' : 'REGULAR PLAN'}
                    </span>
                  </div>
                  <h1 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 4px', lineHeight: 1.35 }}>
                    {a.name}
                  </h1>
                  <p style={{ fontSize: 11, color: '#ffffff80', margin: '0 0 8px' }}>{a.fundHouse}</p>
                  <div style={{
                    display: 'inline-block', background: '#ffffff15',
                    borderRadius: 6, padding: '3px 8px', fontSize: 10, color: '#ffffffb0', marginBottom: 8,
                  }}>{a.category}</div>
                  <div style={{ fontSize: 13, color: '#ffffff90', fontStyle: 'italic' }}>{a.verdict}</div>
                </div>
              </div>

              {/* NAV + CAGR strip */}
              <div style={{
                marginTop: 16, paddingTop: 14, borderTop: '1px solid #ffffff15',
                display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
              }}>
                <div>
                  <div style={{ fontSize: 10, color: '#ffffff60', marginBottom: 2 }}>LATEST NAV</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>₹ {a.latestNAV.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: '#ffffff50' }}>{fmtDate(a.latestDate)}</div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: '1Y', val: a.cagr1Y },
                    { label: '3Y', val: a.cagr3Y },
                    { label: '5Y', val: a.cagr5Y },
                  ].map(({ label, val }) => val !== 0 && (
                    <div key={label} style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: '#ffffff60', marginBottom: 2 }}>{label} CAGR</div>
                      <div style={{
                        fontSize: 16, fontWeight: 700,
                        color: val >= 12 ? '#0FA958' : val >= 8 ? '#F5D080' : '#F5AAAA',
                      }}>
                        {val > 0 ? '+' : ''}{fmt(val)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Pillar scores ── */}
            {(() => {
              const costScore = a.breakdown.slice(0, 2).reduce((s, b) => s + b.score, 0)
              const returnScore = a.breakdown.slice(2, 5).reduce((s, b) => s + b.score, 0)
              const riskScore = a.breakdown.slice(5, 9).reduce((s, b) => s + b.score, 0)
              const structScore = a.breakdown.slice(9, 12).reduce((s, b) => s + b.score, 0)
              return (
                <div className="animate-fadeUp delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Cost', score: costScore, max: 20, color: '#0FA958' },
                    { label: 'Returns', score: returnScore, max: 30, color: '#4F3FFF' },
                    { label: 'Risk', score: riskScore, max: 35, color: '#D97706' },
                    { label: 'Structure', score: structScore, max: 15, color: '#E53E3E' },
                  ].map(p => (
                    <div key={p.label} className="card" style={{ padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{p.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: p.color, marginBottom: 6 }}>
                        {p.score}/{p.max}
                      </div>
                      <div style={{ height: 4, background: 'var(--surface)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', background: p.color,
                          width: `${(p.score / p.max) * 100}%`, transition: 'width 300ms ease-out',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* ── Risk badge ── */}
            {(() => {
              let riskLabel = 'Moderate Risk'
              let riskColor = '#D97706'
              if (a.stdDevAnnual < 14 && a.maxDrawdown < 20) {
                riskLabel = 'Low Risk'
                riskColor = '#0FA958'
              } else if (a.stdDevAnnual > 20 || a.maxDrawdown > 35) {
                riskLabel = 'High Risk'
                riskColor = '#E53E3E'
              }
              return (
                <div style={{
                  display: 'inline-block', background: `${riskColor}20`, borderRadius: 6,
                  padding: '4px 10px', marginBottom: 12, fontSize: 11, fontWeight: 600, color: riskColor,
                }}>
                  {riskLabel} Profile
                </div>
              )
            })()}

            {/* ── Score breakdown ── */}
            <div className="card animate-fadeUp delay-1" style={{ padding: 16, marginBottom: 12 }}>
              <SectionHeader icon={<BarChart2 size={16} />} title="Score breakdown" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {a.breakdown.map((b, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {b.good
                          ? <CheckCircle size={13} color="#0FA958" />
                          : b.score > 0
                            ? <AlertTriangle size={13} color="#D97706" />
                            : <XCircle size={13} color="#E53E3E" />
                        }
                        <span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 500 }}>{b.label}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(b.score / b.max * 100) }}>
                        {b.score}/{b.max}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${(b.score / b.max) * 100}%`,
                        background: b.good ? '#0FA958' : b.score > 0 ? '#D97706' : '#E53E3E',
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{b.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Returns ── */}
            <div className="card animate-fadeUp delay-2" style={{ padding: 16, marginBottom: 12 }}>
              <SectionHeader icon={<TrendingUp size={16} />} title="Returns" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: '1Y CAGR', val: a.cagr1Y },
                  { label: '3Y CAGR', val: a.cagr3Y },
                  { label: '5Y CAGR', val: a.cagr5Y },
                  { label: '10Y CAGR', val: a.cagr10Y },
                  { label: 'Since inception', val: a.cagrAll },
                  { label: 'Alpha vs Nifty 50', val: a.alpha },
                ].map(({ label, val }) => (
                  <MetricCard
                    key={label} label={label}
                    value={val !== 0 ? (val > 0 ? '+' : '') + fmt(val) : 'N/A'}
                    suffix={val !== 0 ? '%' : ''}
                    color={val === 0 ? 'default' : val > 0 ? 'green' : 'red'}
                    sub={val === 0 ? 'Insufficient data' : undefined}
                  />
                ))}
              </div>

              {a.navChart.length > 3 && (
                <>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 8 }}>NAV history</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={a.navChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#4F3FFF" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#4F3FFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.split('-')[2]} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip content={<NavTooltip />} />
                      <Area type="monotone" dataKey="nav" stroke="#4F3FFF" strokeWidth={2} fill="url(#navGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            {/* ── Risk ── */}
            <div className="card animate-fadeUp delay-3" style={{ padding: 16, marginBottom: 12 }}>
              <SectionHeader icon={<Shield size={16} />} title="Risk & quality" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <MetricCard label="Sharpe ratio" value={fmt(a.sharpe)}
                  color={a.sharpe >= 1 ? 'green' : a.sharpe >= 0.5 ? 'amber' : 'red'}
                  sub={a.sharpe >= 2 ? 'Excellent' : a.sharpe >= 1 ? 'Good' : 'Below average'} />
                <MetricCard label="Sortino ratio" value={fmt(a.sortino)}
                  color={a.sortino >= 1 ? 'green' : a.sortino >= 0.5 ? 'amber' : 'red'}
                  sub="Downside-only risk" />
                <MetricCard label="Annual volatility" value={fmt(a.stdDevAnnual)} suffix="%"
                  color={a.stdDevAnnual < 14 ? 'green' : a.stdDevAnnual < 20 ? 'amber' : 'red'}
                  sub={a.stdDevAnnual < 14 ? 'Low' : a.stdDevAnnual < 20 ? 'Moderate' : 'High'} />
                <MetricCard label="Max drawdown" value={'-' + fmt(a.maxDrawdown)} suffix="%"
                  color={a.maxDrawdown < 20 ? 'green' : a.maxDrawdown < 35 ? 'amber' : 'red'}
                  sub="Worst peak-to-trough" />
                <MetricCard label="Beta" value={fmt(a.beta)}
                  color={a.beta >= 0.8 && a.beta <= 1.1 ? 'green' : 'amber'}
                  sub="Market sensitivity" />
                <MetricCard label="Positive months" value={fmt(a.positiveMonths)} suffix="%"
                  color={a.positiveMonths > 65 ? 'green' : a.positiveMonths > 55 ? 'amber' : 'red'}
                  sub="Of all months" />
              </div>
            </div>

            {/* ── Rolling returns ── */}
            {a.rolling3Y.length > 5 && (
              <div className="card animate-fadeUp delay-3" style={{ padding: 16, marginBottom: 12 }}>
                <SectionHeader icon={<BarChart2 size={16} />} title="Rolling 3Y returns" />
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px' }}>
                  Every possible 3-year window — tests consistency across all market cycles
                </p>
                {(() => {
                  const pos  = a.rolling3Y.filter(r => r.return > 0).length
                  const pct  = (pos / a.rolling3Y.length * 100).toFixed(0)
                  const avg  = (a.rolling3Y.reduce((s, r) => s + r.return, 0) / a.rolling3Y.length).toFixed(1)
                  const min  = Math.min(...a.rolling3Y.map(r => r.return)).toFixed(1)
                  const max  = Math.max(...a.rolling3Y.map(r => r.return)).toFixed(1)
                  return (
                    <>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
                        {[
                          { label: 'POSITIVE WINDOWS', value: `${pct}%`, color: +pct > 75 ? '#0FA958' : '#D97706' },
                          { label: 'AVG RETURN',       value: `${+avg > 0 ? '+' : ''}${avg}%`, color: +avg > 0 ? '#0FA958' : '#E53E3E' },
                          { label: 'WORST WINDOW',     value: `${min}%`, color: '#E53E3E' },
                          { label: 'BEST WINDOW',      value: `+${max}%`, color: '#0FA958' },
                        ].map(({ label, value, color }) => (
                          <div key={label}>
                            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 17, fontWeight: 700, color }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={a.rolling3Y} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="rollGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#0FA958" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#0FA958" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.split('-')[2]} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9 }} unit="%" />
                          <Tooltip content={<RollingTooltip />} />
                          <ReferenceLine y={0}    stroke="#E53E3E" strokeDasharray="3 3" strokeWidth={1} />
                          <ReferenceLine y={12.5} stroke="#0FA958" strokeDasharray="3 3" strokeWidth={1}
                            label={{ value: 'benchmark', fontSize: 9, fill: '#0FA958' }} />
                          <Area type="monotone" dataKey="return" stroke="#0FA958" strokeWidth={1.5} fill="url(#rollGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </>
                  )
                })()}
              </div>
            )}

            {/* ── Rolling 5Y returns ── */}
            {a.rolling5Y.length > 5 && (
              <div className="card animate-fadeUp delay-3" style={{ padding: 16, marginBottom: 12 }}>
                <SectionHeader icon={<BarChart2 size={16} />} title="Rolling 5Y returns" />
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px' }}>
                  Every possible 5-year window — longer-term consistency across cycles
                </p>
                {(() => {
                  const pos  = a.rolling5Y.filter(r => r.return > 0).length
                  const pct  = (pos / a.rolling5Y.length * 100).toFixed(0)
                  const avg  = (a.rolling5Y.reduce((s, r) => s + r.return, 0) / a.rolling5Y.length).toFixed(1)
                  const min  = Math.min(...a.rolling5Y.map(r => r.return)).toFixed(1)
                  const max  = Math.max(...a.rolling5Y.map(r => r.return)).toFixed(1)
                  return (
                    <>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
                        {[
                          { label: 'POSITIVE WINDOWS', value: `${pct}%`, color: +pct > 80 ? '#0FA958' : '#D97706' },
                          { label: 'AVG RETURN',       value: `${+avg > 0 ? '+' : ''}${avg}%`, color: +avg > 0 ? '#0FA958' : '#E53E3E' },
                          { label: 'WORST WINDOW',     value: `${min}%`, color: '#E53E3E' },
                          { label: 'BEST WINDOW',      value: `+${max}%`, color: '#0FA958' },
                        ].map(({ label, value, color }) => (
                          <div key={label}>
                            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 17, fontWeight: 700, color }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={a.rolling5Y} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="roll5Grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#0FA958" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#0FA958" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.split('-')[2]} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 9 }} unit="%" />
                          <Tooltip content={<RollingTooltip />} />
                          <ReferenceLine y={0}    stroke="#E53E3E" strokeDasharray="3 3" strokeWidth={1} />
                          <ReferenceLine y={12.5} stroke="#0FA958" strokeDasharray="3 3" strokeWidth={1}
                            label={{ value: 'benchmark', fontSize: 9, fill: '#0FA958' }} />
                          <Area type="monotone" dataKey="return" stroke="#0FA958" strokeWidth={1.5} fill="url(#roll5Grad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </>
                  )
                })()}
              </div>
            )}

            {/* ── SIP Projector ── */}
            {(() => {
              const cagrToUse = a.cagr5Y || a.cagr3Y || a.cagr1Y || 8
              const sip = sipProjection(sipMonth, sipYears, cagrToUse)
              return (
                <div className="card animate-fadeUp delay-3" style={{ padding: 16, marginBottom: 12 }}>
                  <SectionHeader icon={<TrendingUp size={16} />} title="SIP Wealth Projector" />
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 14px' }}>
                    See how your regular monthly investments could grow with this fund's historical returns
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Monthly SIP (₹)</label>
                      <input
                        type="number"
                        value={sipMonth}
                        onChange={e => setSipMonth(Number(e.target.value) || 0)}
                        min="1000"
                        step="1000"
                        style={{
                          width: '100%', padding: '8px 10px', borderRadius: 8,
                          border: '1px solid var(--border)', background: 'var(--white)',
                          fontSize: 13, color: 'var(--ink)', fontWeight: 600,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Duration (years)</label>
                      <select
                        value={sipYears}
                        onChange={e => setSipYears(Number(e.target.value))}
                        style={{
                          width: '100%', padding: '8px 10px', borderRadius: 8,
                          border: '1px solid var(--border)', background: 'var(--white)',
                          fontSize: 13, color: 'var(--ink)', fontWeight: 600,
                        }}
                      >
                        {[5, 10, 15, 20].map(y => <option key={y} value={y}>{y} years</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <MetricCard
                      label="Total Invested" value={fmt(sip.invested / 100000)} suffix="L"
                      color="default" sub={`At ₹${fmt(sipMonth)}`} />
                    <MetricCard
                      label="Value at Fund CAGR" value={fmt(sip.projectedAtFundCagr / 100000)} suffix="L"
                      color={sip.projectedAtFundCagr > sip.invested * 2 ? 'green' : 'amber'}
                      sub={`${cagrToUse.toFixed(1)}% CAGR`} />
                    <MetricCard
                      label="Value at FD Rate (6.5%)" value={fmt(sip.projectedAtFDRate / 100000)} suffix="L"
                      color="default" sub="Conservative estimate" />
                    <MetricCard
                      label="Wealth Gain vs FD" value={fmt(sip.wealthGap / 100000)} suffix="L"
                      color={sip.wealthGap > 0 ? 'green' : 'red'}
                      sub={sip.wealthGap > 0 ? 'Equity advantage' : 'Higher risk'} />
                  </div>
                </div>
              )
            })()}

            {/* ── Cost ── */}
            <div className="card animate-fadeUp delay-4" style={{ padding: 16, marginBottom: 12 }}>
              <SectionHeader icon={<DollarSign size={16} />} title="Cost analysis" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <MetricCard label="Expense ratio (est.)" value={fmt(a.expenseRatio)} suffix="%"
                  color={a.expenseRatio < a.categoryExpenseRatio ? 'green' : 'red'}
                  sub={a.expenseRatio < a.categoryExpenseRatio ? 'Below category avg' : 'Above category avg'} />
                <MetricCard label="Category avg expense" value={fmt(a.categoryExpenseRatio)} suffix="%" color="default" sub="Peer benchmark" />
                <MetricCard label="Exit load" value={a.exitLoad === 0 ? 'None' : fmt(a.exitLoad)} suffix={a.exitLoad > 0 ? '%' : ''}
                  color={a.exitLoad === 0 ? 'green' : 'amber'}
                  sub={a.exitLoad === 0 ? 'Free to exit anytime' : 'Check holding period'} />
                <MetricCard label="Plan type" value={a.isDirect ? 'Direct' : 'Regular'}
                  color={a.isDirect ? 'green' : 'amber'}
                  sub={a.isDirect ? 'Lowest cost' : 'Paying commission'} />
              </div>
              {!a.isDirect && (
                <div style={{ marginTop: 12, background: '#FEF3CD', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8 }}>
                  <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: '#854F0B', margin: 0, lineHeight: 1.5 }}>
                    <strong>Switch to Direct plan</strong> — same fund, ~0.7% lower TER every year.
                    On ₹5L over 15 years that is <strong>₹3–5 lakhs extra wealth.</strong>
                  </p>
                </div>
              )}
            </div>

            {/* ── Tips ── */}
            <div className="card animate-fadeUp delay-5" style={{ padding: 16, marginBottom: 12 }}>
              <SectionHeader icon={<Info size={16} />} title="Recommendations" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {a.tips.map((tip, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, padding: '10px 12px',
                    background: 'var(--surface)', borderRadius: 10, alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 99,
                      background: '#4F3FFF18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#4F3FFF' }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.55 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Footer info ── */}
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {[
                  { label: 'Data history',     value: `${a.dataYears} years` },
                  { label: 'Scheme code',       value: String(a.schemeCode) },
                  { label: 'Monthly std dev',   value: `${fmt(a.stdDevMonthly)}%` },
                  { label: 'Positive months',   value: `${a.positiveMonths}%` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: 'var(--muted-2)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-2)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                Expense ratio is estimated from category & plan type. Alpha is vs approximate Nifty 50 benchmark (~12.5% CAGR).
                Beta is estimated from fund return profile. Verify exact values on Valueresearchonline or Morningstar.
              </div>
            </div>

            {/* ── Spacer for bottom nav ── */}
            <div style={{ height: 20 }} />

          </div>
        )}

        {/* ── Recently viewed ── */}
        {!a && !loading && recentFunds.length > 0 && (
          <div className="animate-fadeUp delay-1" style={{ marginTop: 24, marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px 4px', fontWeight: 600 }}>RECENTLY VIEWED</p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
              {recentFunds.map(r => (
                <button
                  key={r.schemeCode}
                  onClick={() => selectFund(r.schemeCode, r.schemeName)}
                  style={{
                    padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--white)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
                >
                  <span style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'left' }}>{r.schemeName}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: '#4F3FFF',
                      background: '#4F3FFF15', borderRadius: 4, padding: '2px 6px',
                    }}>
                      {r.totalScore}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: r.grade.includes('+') ? '#0FA958' : '#D97706' }}>
                      {r.grade}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Landing feature grid ── */}
        {!a && !loading && (
          <div className="animate-fadeUp delay-2" style={{ marginTop: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: <TrendingUp size={16} />,   title: 'CAGR 1Y/3Y/5Y/10Y',   desc: 'Calculated from live NAV history' },
                { icon: <Shield size={16} />,        title: 'Sharpe & Sortino',      desc: 'Real risk-adjusted return ratios' },
                { icon: <BarChart2 size={16} />,     title: 'Rolling returns',        desc: 'Consistency across every cycle' },
                { icon: <TrendingDown size={16} />,  title: 'Max drawdown',           desc: 'Worst historical loss measured' },
                { icon: <DollarSign size={16} />,    title: 'Cost analysis',          desc: 'TER vs category benchmark' },
                { icon: <Info size={16} />,           title: 'Score / 100',            desc: 'Weighted formula with verdict' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="card-sm" style={{ padding: '12px 14px' }}>
                  <div style={{ color: '#4F3FFF', marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  )
}