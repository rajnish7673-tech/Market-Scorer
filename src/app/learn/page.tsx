'use client'
import { useState } from 'react'
import { Search, ChevronLeft, TrendingUp, DollarSign, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Term {
  id: string
  name: string
  category: 'Basics' | 'Returns' | 'Risk' | 'Cost'
  definition: string
  analogy: string
  goodRange?: string
  relatedTerms?: string[]
}

const glossaryTerms: Term[] = [
  {
    id: 'nav',
    name: 'NAV (Net Asset Value)',
    category: 'Basics',
    definition: 'The per-unit price of a mutual fund — what you pay per share you own.',
    analogy: 'Like a stock price. If NAV is ₹100 and you invest ₹10,000, you get 100 units.',
    goodRange: 'Any level — NAV grows over time',
    relatedTerms: ['Direct vs Regular', 'CAGR'],
  },
  {
    id: 'expense-ratio',
    name: 'Expense Ratio (ER)',
    category: 'Cost',
    definition: 'Annual fee charged by the fund house to manage your money.',
    analogy: 'Like a restaurant service charge taken invisibly every year. 1.5% ER on ₹1L = ₹1,500 deducted annually from growth.',
    goodRange: '< 1% is good, < 0.5% is excellent',
    relatedTerms: ['Direct vs Regular', 'Category Expense Ratio'],
  },
  {
    id: 'direct-vs-regular',
    name: 'Direct vs Regular Plan',
    category: 'Cost',
    definition: 'Two ways to buy the same fund — Direct (no broker) vs Regular (through agent).',
    analogy: 'Direct = buying vegetables from the farm. Regular = buying from a middleman who pockets a cut every year.',
    goodRange: 'Always choose Direct — saves ~0.7% annually',
    relatedTerms: ['Expense Ratio'],
  },
  {
    id: 'cagr',
    name: 'CAGR (Compound Annual Growth Rate)',
    category: 'Returns',
    definition: 'The steady annual growth rate that would give the same final result.',
    analogy: `Like a fixed deposit rate for investments. If ₹1L became ₹1.6L in 5 years, CAGR is ~10% — the "smoothed" annual rate.`,
    goodRange: '> 12% is good, > 15% is excellent',
    relatedTerms: ['XIRR', 'Rolling Returns', 'Alpha'],
  },
  {
    id: 'xirr',
    name: 'XIRR (Modified Dietz Return)',
    category: 'Returns',
    definition: 'The true annualized return for irregular investments (SIPs with different amounts).',
    analogy: `CAGR's smarter cousin for SIPs. When you invest different amounts on different dates, XIRR tells the actual return you earned.`,
    goodRange: '> 12% is good',
    relatedTerms: ['CAGR', 'SIP'],
  },
  {
    id: 'alpha',
    name: 'Alpha',
    category: 'Returns',
    definition: `Excess return over the benchmark — the manager's skill edge.`,
    analogy: 'Like extra marks a student gets beyond expected. Fund gave 15%, market gave 12% → Alpha = +3%. Negative = underperformance.',
    goodRange: '> 0% is good (beating benchmark), > 3% is excellent',
    relatedTerms: ['CAGR', 'Benchmark', 'Beta'],
  },
  {
    id: 'beta',
    name: 'Beta',
    category: 'Risk',
    definition: 'How much the fund swings compared to the market.',
    analogy: `Like a car's suspension. Beta 1.2 = 20% worse bumps than market. Beta 0.8 = 20% more cushioned.`,
    goodRange: '0.8–1.1 is ideal (moving with market)',
    relatedTerms: ['Alpha', 'Volatility', 'Benchmark'],
  },
  {
    id: 'sharpe-ratio',
    name: 'Sharpe Ratio',
    category: 'Risk',
    definition: 'Return earned per unit of risk taken.',
    analogy: 'Two traders earn ₹1L profit: one risked ₹10L, other risked ₹2L. Second has better Sharpe (more reward per rupee of risk).',
    goodRange: '> 1 is good, > 2 is excellent',
    relatedTerms: ['Sortino Ratio', 'Volatility', 'Max Drawdown'],
  },
  {
    id: 'sortino-ratio',
    name: 'Sortino Ratio',
    category: 'Risk',
    definition: 'Like Sharpe, but only counts bad days (downside volatility).',
    analogy: 'A fund that swings wildly upward but rarely falls scores well on Sortino. Sharpe would penalize both ups and downs.',
    goodRange: '> 1 is good',
    relatedTerms: ['Sharpe Ratio', 'Volatility'],
  },
  {
    id: 'volatility',
    name: 'Volatility / Standard Deviation',
    category: 'Risk',
    definition: 'How much the fund bounces around — unpredictability of returns.',
    analogy: 'Cricket batting consistency. High volatility = scores 0 or 150. Low volatility = consistent 40–60 every match.',
    goodRange: '< 14% annually is low, < 20% is moderate',
    relatedTerms: ['Sharpe Ratio', 'Max Drawdown', 'Beta'],
  },
  {
    id: 'max-drawdown',
    name: 'Max Drawdown',
    category: 'Risk',
    definition: 'The worst peak-to-trough loss the fund has experienced.',
    analogy: 'Climbed a mountain to ₹150, fell to ₹90 = 40% drawdown. Tells you the worst pain you would have felt holding it.',
    goodRange: '< 20% is low, < 35% is moderate',
    relatedTerms: ['Volatility', 'Rolling Returns'],
  },
  {
    id: 'rolling-returns',
    name: 'Rolling Returns',
    category: 'Returns',
    definition: 'Fund returns across every possible N-year window, not just one.',
    analogy: `Checking a school's pass rate not just this year but for every possible 3-year period. Filters out lucky streaks.`,
    goodRange: '> 75% windows positive is good',
    relatedTerms: ['CAGR', 'Volatility'],
  },
  {
    id: 'pe-ratio',
    name: 'PE Ratio (Price-to-Earnings)',
    category: 'Returns',
    definition: `How many years of current earnings you're paying for a stock or fund.`,
    analogy: 'Buying a shop. PE 20 = paying 20 years of current profits upfront. High PE = paying for future hope, low PE = value territory.',
    goodRange: 'Fund average shown in Score; compare to category',
    relatedTerms: ['CAGR', 'Alpha', 'Benchmark'],
  },
  {
    id: 'category-expense-ratio',
    name: 'Category Expense Ratio',
    category: 'Cost',
    definition: 'Average expense ratio for all funds in this category.',
    analogy: `Like knowing the neighborhood restaurant average. Your ER of 1.2% vs category avg 1.4% = you're getting a good deal.`,
    goodRange: 'Your ER < category average is good',
    relatedTerms: ['Expense Ratio', 'Direct vs Regular'],
  },
  {
    id: 'exit-load',
    name: 'Exit Load',
    category: 'Cost',
    definition: 'Penalty charged if you withdraw before a specified holding period.',
    analogy: 'Hotel cancellation policy. Exit within 1 year = 1% charge on your redemption amount.',
    goodRange: '0% (can exit anytime) is best',
    relatedTerms: ['Expense Ratio'],
  },
  {
    id: 'aum',
    name: 'AUM (Assets Under Management)',
    category: 'Basics',
    definition: 'Total money invested in the fund by all investors combined.',
    analogy: `Like a bank branch's monthly deposits. Bigger AUM = more trust. But for small-cap funds, too much AUM limits agility.`,
    goodRange: '₹500 Cr–5000 Cr ideal for most categories',
    relatedTerms: ['NAV'],
  },
  {
    id: 'sip',
    name: 'SIP (Systematic Investment Plan)',
    category: 'Basics',
    definition: 'Investing a fixed amount every month, regardless of market level.',
    analogy: 'Gym membership model. Fixed ₹5,000 every month. Rupee cost averaging works in your favor — you buy more units when prices fall.',
    goodRange: 'Minimum 5 years; 10+ years better',
    relatedTerms: ['XIRR', 'NAV', 'Volatility'],
  },
  {
    id: 'elss',
    name: 'ELSS (Equity-Linked Saving Scheme)',
    category: 'Basics',
    definition: 'Tax-saving mutual fund with 3-year lock-in period.',
    analogy: 'Tax-saving FD but in equity. 3-year lock-in, saves up to ₹46,800 in tax under Section 80C every year.',
    goodRange: 'Invest for tax benefit + growth',
    relatedTerms: ['SIP', 'CAGR'],
  },
  {
    id: 'positive-months',
    name: 'Positive Months %',
    category: 'Returns',
    definition: 'Percentage of months where the fund returned positive gains.',
    analogy: 'Out of 60 months, 45 were profitable = 75% positive months. > 65% = reliable compounding engine.',
    goodRange: '> 65% is good, > 75% is excellent',
    relatedTerms: ['Rolling Returns', 'Volatility'],
  },
  {
    id: 'benchmark',
    name: 'Benchmark',
    category: 'Returns',
    definition: 'The market index your fund is racing against.',
    analogy: 'Like competing in a race. Nifty 50 for large-cap, Nifty Midcap for mid-cap. Fund should beat its benchmark.',
    goodRange: 'Fund return > Benchmark return',
    relatedTerms: ['Alpha', 'CAGR', 'Beta'],
  },
  {
    id: 'inception-date',
    name: 'Inception Date',
    category: 'Basics',
    definition: 'The date the fund was launched.',
    analogy: `Like a person's age. Older funds (10+ years) have more track record. Younger funds are riskier to invest in.`,
    goodRange: '> 5 years good, > 10 years better',
    relatedTerms: ['Rolling Returns'],
  },
]

const categories = ['Basics', 'Returns', 'Risk', 'Cost'] as const

export default function LearnPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[number] | 'All'>('All')

  // Interactive SIP Demo
  const [sipAmount, setSipAmount] = useState(5000)
  const [sipYears, setSipYears] = useState(10)
  const [sipCagr, setSipCagr] = useState(12)
  const sipData = Array.from({ length: sipYears * 12 }, (_, i) => {
    const months = i + 1
    const years = months / 12
    const monthlyRate = (1 + sipCagr / 100) ** (1 / 12) - 1
    const fv = sipAmount * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate)
    return { month: months, value: Math.round(fv), invested: sipAmount * months }
  })

  // Interactive Volatility Demo (simulate fund price movements)
  const [volatility, setVolatility] = useState(12)
  const volatilityData = Array.from({ length: 36 }, (_, i) => {
    const basePrice = 100
    const randomWalk = Math.sin(i * 0.5) * (volatility / 100) * basePrice * 0.3
    const noiseScale = volatility / 100
    const noise = (Math.random() - 0.5) * noiseScale * basePrice
    const price = basePrice + randomWalk + noise + (i * 0.2)
    return { month: i + 1, nav: Math.max(80, Math.round(price * 100) / 100) }
  }).sort(() => (Math.random() - 0.5) * volatility / 100)

  // Interactive Expense Ratio Impact
  const [investment, setInvestment] = useState(500000)
  const [years, setYears] = useState(10)
  const [baseReturn, setBaseReturn] = useState(12)
  const erComparison = [
    { er: 0.5, label: 'Direct (0.5%)', value: Math.round(investment * Math.pow(1 + (baseReturn - 0.5) / 100, years)), color: '#0FA958' },
    { er: 1.0, label: 'Good (1%)', value: Math.round(investment * Math.pow(1 + (baseReturn - 1) / 100, years)), color: '#F5D080' },
    { er: 1.5, label: 'Avg (1.5%)', value: Math.round(investment * Math.pow(1 + (baseReturn - 1.5) / 100, years)), color: '#D97706' },
    { er: 2.0, label: 'High (2%)', value: Math.round(investment * Math.pow(1 + (baseReturn - 2) / 100, years)), color: '#E53E3E' },
  ]

  const filtered = glossaryTerms.filter(term => {
    const matchesQuery = term.name.toLowerCase().includes(query.toLowerCase()) ||
      term.definition.toLowerCase().includes(query.toLowerCase()) ||
      term.analogy.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory
    return matchesQuery && matchesCategory
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {/* ── Header ── */}
      <div style={{
        background: 'var(--ink-2)', padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid #ffffff10',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', height: 52, gap: 10 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, color: '#fff', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </Link>
          <span className="font-display" style={{ fontSize: 17, color: '#fff', letterSpacing: '-.01em' }}>MF Glossary</span>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 100px' }}>
        {/* ── Search ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--white)', border: '1.5px solid var(--border-2)',
            borderRadius: 12, padding: '0 12px', height: 44,
            boxShadow: '0 2px 8px rgba(0,0,0,.04)',
          }}>
            <Search size={16} color="var(--muted)" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search terms, analogies…"
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent', fontSize: 13, color: 'var(--ink)',
              }}
            />
          </div>
        </div>

        {/* ── Category Filter ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {(['All', ...categories] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                background: selectedCategory === cat ? '#4F3FFF' : 'var(--surface)',
                color: selectedCategory === cat ? '#fff' : 'var(--muted)',
                boxShadow: selectedCategory === cat ? '0 2px 8px #4F3FFF40' : 'none',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Interactive Demos (when showing All categories) ── */}
        {selectedCategory === 'All' && query.length === 0 && (
          <div style={{ marginBottom: 20 }}>
            {/* SIP Demo */}
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#4F3FFF18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#4F3FFF" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Interactive: SIP Growth</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Monthly (₹)</label>
                  <input type="range" min="1000" max="50000" step="1000" value={sipAmount} onChange={e => setSipAmount(Number(e.target.value))} style={{ width: '100%' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#4F3FFF', marginTop: 4 }}>₹{sipAmount.toLocaleString()}</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Years</label>
                  <input type="range" min="1" max="30" step="1" value={sipYears} onChange={e => setSipYears(Number(e.target.value))} style={{ width: '100%' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#4F3FFF', marginTop: 4 }}>{sipYears} years</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Annual Return</label>
                  <input type="range" min="0" max="25" step="1" value={sipCagr} onChange={e => setSipCagr(Number(e.target.value))} style={{ width: '100%' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#4F3FFF', marginTop: 4 }}>{sipCagr}% p.a.</div>
                </div>
              </div>

              {sipData.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={sipData}>
                      <defs>
                        <linearGradient id="sipGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F3FFF" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#4F3FFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} label={{ value: 'Months', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 9 }} label={{ value: '₹', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                      <Area type="monotone" dataKey="value" stroke="#4F3FFF" fill="url(#sipGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>TOTAL INVESTED</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#4F3FFF' }}>₹{(sipAmount * sipYears * 12).toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>FINAL VALUE</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: sipData[sipData.length - 1]?.value > sipAmount * sipYears * 12 ? '#0FA958' : '#E53E3E' }}>
                    ₹{sipData[sipData.length - 1]?.value.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* Volatility Demo */}
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#4F3FFF18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={16} color="#4F3FFF" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Interactive: Volatility Impact</h3>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Annual Volatility: {volatility}%</label>
                <input type="range" min="5" max="40" step="1" value={volatility} onChange={e => setVolatility(Number(e.target.value))} style={{ width: '100%' }} />
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  {volatility < 12 ? '🟢 Low — stable fund, boring but safe' : volatility < 20 ? '🟡 Moderate — typical large-cap fund' : volatility < 30 ? '🔴 High — small-cap territory' : '🔴 Very High — needs strong conviction'}
                </div>
              </div>

              {volatilityData.length > 0 && (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={volatilityData}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={volatility < 14 ? '#0FA958' : volatility < 20 ? '#F5D080' : '#E53E3E'} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={volatility < 14 ? '#0FA958' : volatility < 20 ? '#F5D080' : '#E53E3E'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => v.toFixed(2)} />
                    <Area type="monotone" dataKey="nav" stroke={volatility < 14 ? '#0FA958' : volatility < 20 ? '#F5D080' : '#E53E3E'} fill={`url(#volGrad)`} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Expense Ratio Impact Demo */}
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#4F3FFF18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} color="#4F3FFF" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Interactive: Expense Ratio Impact</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Investment (₹)</label>
                  <input type="range" min="100000" max="2000000" step="50000" value={investment} onChange={e => setInvestment(Number(e.target.value))} style={{ width: '100%' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#4F3FFF', marginTop: 4 }}>₹{(investment / 100000).toFixed(1)}L</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Duration</label>
                  <input type="range" min="1" max="30" step="1" value={years} onChange={e => setYears(Number(e.target.value))} style={{ width: '100%' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#4F3FFF', marginTop: 4 }}>{years} years</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {erComparison.map(item => (
                  <div key={item.label} style={{ background: 'var(--surface)', borderRadius: 8, padding: 10, borderLeft: `4px solid ${item.color}` }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>₹{(item.value / 100000).toFixed(1)}L</div>
                    <div style={{ fontSize: 9, color: 'var(--muted-2)', marginTop: 4 }}>Loss: ₹{Math.round((erComparison[0].value - item.value) / 100000 * 10) / 10}L</div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '12px 0 0', lineHeight: 1.6 }}>
                💡 Even 0.5% ER difference compounds significantly. On ₹{(investment / 100000).toFixed(1)}L over {years} years at {baseReturn}% return, Direct saves ₹{Math.round((erComparison[erComparison.length - 1].value - erComparison[0].value) / 100000 * 10) / 10}L+
              </p>
            </div>
          </div>
        )}

        {/* ── Terms Grid ── */}
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {filtered.map(term => (
              <div key={term.id} className="card" style={{ padding: 16, marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{term.name}</h3>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: '#fff',
                    background: '#4F3FFF', borderRadius: 4, padding: '3px 8px', whiteSpace: 'nowrap',
                  }}>
                    {term.category}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--ink)' }}>Definition:</strong> {term.definition}
                </p>

                <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <p style={{ fontSize: 12, color: 'var(--ink)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                    💡 <strong>Analogy:</strong> {term.analogy}
                  </p>
                </div>

                {term.goodRange && (
                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 8px' }}>
                    <strong>Good range:</strong> {term.goodRange}
                  </p>
                )}

                {term.relatedTerms && term.relatedTerms.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {term.relatedTerms.map(related => (
                      <span key={related} style={{
                        fontSize: 10, color: '#4F3FFF', background: '#4F3FFF15',
                        borderRadius: 4, padding: '4px 8px',
                      }}>
                        → {related}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>No terms found. Try a different search.</p>
          </div>
        )}

        {/* ── Footer note ── */}
        <div style={{ marginTop: 40, padding: 16, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, color: 'var(--muted-2)', margin: 0, lineHeight: 1.6 }}>
            <strong>📚 MF Glossary:</strong> Learn mutual fund terminology with simple analogies. These terms appear in FundIQ's analysis — understanding them helps you make better investment decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
