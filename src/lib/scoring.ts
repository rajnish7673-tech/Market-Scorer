export interface NavEntry { date: string; nav: string }
export interface FundMeta {
  fund_house: string
  scheme_type: string
  scheme_category: string
  scheme_code: number
  scheme_name: string
}
export interface FundData {
  meta: FundMeta
  data: NavEntry[]
}
export interface SearchResult {
  schemeCode: number
  schemeName: string
}

// ── API ────────────────────────────────────────────────────────────────────────
const BASE = 'https://api.mfapi.in'

// /mf/search is BROKEN on mfapi.in — always returns [].
// Fix: fetch the full scheme list once from GET /mf, then search client-side.
let _schemeCache: SearchResult[] | null = null
let _schemeFetchPromise: Promise<SearchResult[]> | null = null

export async function getAllSchemes(): Promise<SearchResult[]> {
  if (_schemeCache) return _schemeCache
  if (!_schemeFetchPromise) {
    _schemeFetchPromise = fetch(`${BASE}/mf`)
      .then(r => {
        if (!r.ok) throw new Error(`Scheme list fetch failed: ${r.status}`)
        return r.json() as Promise<SearchResult[]>
      })
      .then(data => {
        _schemeCache = data
        return data
      })
  }
  return _schemeFetchPromise
}

export async function searchFunds(query: string): Promise<SearchResult[]> {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  const all = await getAllSchemes()
  const words = q.split(/\s+/).filter(Boolean)

  const scored: { result: SearchResult; score: number }[] = []
  for (const s of all) {
    const name = s.schemeName.toLowerCase()
    let score = 0
    let allMatch = true
    for (const w of words) {
      if (name.includes(w)) {
        score += w.length * 2
        if (name.startsWith(w)) score += 5
      } else {
        allMatch = false
      }
    }
    if (allMatch && score > 0) scored.push({ result: s, score })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(x => x.result)
}

export async function fetchFund(code: number): Promise<FundData> {
  const res = await fetch(`${BASE}/mf/${code}`)
  if (!res.ok) throw new Error(`Fund fetch failed: ${res.status}`)
  return res.json()
}

// ── Date helpers ───────────────────────────────────────────────────────────────
function parseDate(d: string): Date {
  const [dd, mm, yyyy] = d.split('-')
  return new Date(+yyyy, +mm - 1, +dd)
}

function navAtDate(data: NavEntry[], targetDate: Date): number | null {
  const sorted = [...data].sort(
    (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
  )
  for (const e of sorted) {
    if (parseDate(e.date) <= targetDate) return parseFloat(e.nav)
  }
  return null
}

function yearsAgo(n: number): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - n)
  return d
}

// ── CAGR ───────────────────────────────────────────────────────────────────────
function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || years <= 0) return 0
  return (Math.pow(end / start, 1 / years) - 1) * 100
}

// ── Rolling returns ────────────────────────────────────────────────────────────
export interface RollingPoint { date: string; return: number }

function rollingReturns(data: NavEntry[], years: number): RollingPoint[] {
  const sorted = [...data]
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
    .filter((_, i) => i % 7 === 0)

  const results: RollingPoint[] = []
  for (const entry of sorted) {
    const endNav = parseFloat(entry.nav)
    const endDate = parseDate(entry.date)
    const startDate = new Date(endDate)
    startDate.setFullYear(startDate.getFullYear() - years)
    const startNav = navAtDate(data, startDate)
    if (startNav && startNav > 0) {
      results.push({
        date: entry.date,
        return: parseFloat(cagr(startNav, endNav, years).toFixed(2)),
      })
    }
  }
  return results
}

// ── Monthly returns ────────────────────────────────────────────────────────────
function monthlyReturns(data: NavEntry[]): number[] {
  const sorted = [...data].sort(
    (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
  )
  const monthly: Record<string, number> = {}
  for (const e of sorted) {
    const d = parseDate(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthly[key] = parseFloat(e.nav)
  }
  const keys = Object.keys(monthly).sort()
  const returns: number[] = []
  for (let i = 1; i < keys.length; i++) {
    const prev = monthly[keys[i - 1]]
    const curr = monthly[keys[i]]
    if (prev > 0) returns.push(((curr - prev) / prev) * 100)
  }
  return returns
}

// ── Stats ──────────────────────────────────────────────────────────────────────
function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length
}
function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.map(x => (x - m) ** 2).reduce((a, b) => a + b, 0) / (arr.length - 1))
}

// ── Risk ratios ────────────────────────────────────────────────────────────────
const RF_MONTHLY = 6.5 / 12 / 100 * 100 // 6.5% annual risk-free in % monthly

function sharpeRatio(monthlyRets: number[]): number {
  if (monthlyRets.length < 6) return 0
  const excess = monthlyRets.map(r => r - RF_MONTHLY)
  const sd = stdDev(excess)
  if (sd === 0) return 0
  return parseFloat(((mean(excess) / sd) * Math.sqrt(12)).toFixed(2))
}

function sortinoRatio(monthlyRets: number[]): number {
  if (monthlyRets.length < 6) return 0
  const excess = monthlyRets.map(r => r - RF_MONTHLY)
  const m = mean(excess)
  const downside = excess.filter(r => r < 0)
  if (downside.length === 0) return 5
  const dssd = Math.sqrt(downside.map(r => r ** 2).reduce((a, b) => a + b, 0) / downside.length)
  if (dssd === 0) return 0
  return parseFloat(((m / dssd) * Math.sqrt(12)).toFixed(2))
}

function maxDrawdown(data: NavEntry[]): number {
  const navs = [...data]
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
    .map(e => parseFloat(e.nav))
  let peak = navs[0]
  let maxDD = 0
  for (const nav of navs) {
    if (nav > peak) peak = nav
    const dd = ((peak - nav) / peak) * 100
    if (dd > maxDD) maxDD = dd
  }
  return parseFloat(maxDD.toFixed(2))
}

function estimateBeta(monthlyRets: number[]): number {
  const mktMean = 1.04
  const mktStd = 4.2
  const raw = (mean(monthlyRets) / mktMean) * (stdDev(monthlyRets) / mktStd)
  return parseFloat(Math.max(0.3, Math.min(2.0, raw)).toFixed(2))
}

function positiveMonthsPct(monthlyRets: number[]): number {
  if (monthlyRets.length === 0) return 0
  return parseFloat(((monthlyRets.filter(r => r > 0).length / monthlyRets.length) * 100).toFixed(1))
}

// ── NAV chart ──────────────────────────────────────────────────────────────────
export interface ChartPoint { date: string; nav: number }

function navChartData(data: NavEntry[], years: number): ChartPoint[] {
  const cutoff = yearsAgo(Math.min(years, 10))
  const monthly: Record<string, NavEntry> = {}
  for (const e of data) {
    if (parseDate(e.date) < cutoff) continue
    const d = parseDate(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthly[key] = e
  }
  return Object.values(monthly)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
    .map(e => ({ date: e.date, nav: parseFloat(e.nav) }))
}

// ── SIP & Projection ───────────────────────────────────────────────────────────
export interface SIPProjection {
  invested: number
  projectedAtFundCagr: number
  projectedAtFDRate: number
  wealthGap: number
}

export function sipProjection(
  monthlyAmount: number,
  years: number,
  annualCagrPercent: number,
  fdRatePercent: number = 6.5
): SIPProjection {
  const months = years * 12
  const monthlyRate = (1 + annualCagrPercent / 100) ** (1 / 12) - 1
  const fdMonthlyRate = (1 + fdRatePercent / 100) ** (1 / 12) - 1

  // FV = P × [((1 + r)^n - 1) / r] × (1 + r)
  // Each SIP grows from the month it was invested
  const cagrFV = monthlyAmount * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate)
  const fdFV = monthlyAmount * (((1 + fdMonthlyRate) ** months - 1) / fdMonthlyRate) * (1 + fdMonthlyRate)
  const invested = monthlyAmount * months

  return {
    invested,
    projectedAtFundCagr: parseFloat(cagrFV.toFixed(0)),
    projectedAtFDRate: parseFloat(fdFV.toFixed(0)),
    wealthGap: parseFloat((cagrFV - fdFV).toFixed(0)),
  }
}

// ── Cost helpers ───────────────────────────────────────────────────────────────
function isDirectPlan(name: string): boolean {
  return /direct/i.test(name)
}

function inferExpenseRatio(category: string, isDirect: boolean): number {
  const c = category.toLowerCase()
  if (c.includes('index') || c.includes('etf'))                        return isDirect ? 0.2 : 0.6
  if (c.includes('overnight') || c.includes('liquid'))                  return isDirect ? 0.1 : 0.3
  if (c.includes('debt') || c.includes('bond') || c.includes('gilt'))   return isDirect ? 0.4 : 0.9
  if (c.includes('large cap') || c.includes('largecap'))                return isDirect ? 0.7 : 1.5
  if (c.includes('mid cap')   || c.includes('midcap'))                  return isDirect ? 0.9 : 1.7
  if (c.includes('small cap') || c.includes('smallcap'))                return isDirect ? 1.0 : 1.8
  if (c.includes('flexi')     || c.includes('multi cap'))               return isDirect ? 0.8 : 1.6
  if (c.includes('hybrid')    || c.includes('balanced'))                return isDirect ? 0.8 : 1.6
  if (c.includes('elss')      || c.includes('tax'))                     return isDirect ? 0.9 : 1.7
  return isDirect ? 0.8 : 1.6
}

function categoryExpenseRatio(category: string): number {
  const c = category.toLowerCase()
  if (c.includes('index') || c.includes('etf'))         return 0.4
  if (c.includes('overnight') || c.includes('liquid'))   return 0.2
  if (c.includes('debt') || c.includes('bond'))          return 0.7
  if (c.includes('large cap') || c.includes('largecap')) return 1.2
  if (c.includes('mid cap')   || c.includes('midcap'))   return 1.4
  if (c.includes('small cap') || c.includes('smallcap')) return 1.5
  if (c.includes('flexi')     || c.includes('multi'))    return 1.3
  if (c.includes('hybrid')    || c.includes('balanced')) return 1.2
  if (c.includes('elss')      || c.includes('tax'))      return 1.4
  return 1.3
}

function inferExitLoad(category: string): number {
  const c = category.toLowerCase()
  if (c.includes('liquid') || c.includes('overnight') || c.includes('money market')) return 0
  if (c.includes('debt') || c.includes('bond') || c.includes('gilt'))                return 0.5
  return 1
}

// ══════════════════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════════════════
export interface ScoreBreakdown {
  label: string
  score: number
  max: number
  note: string
  good: boolean
}

export interface FundAnalysis {
  name: string; category: string; fundHouse: string
  isDirect: boolean; schemeCode: number
  cagr1Y: number; cagr3Y: number; cagr5Y: number; cagr10Y: number; cagrAll: number
  stdDevMonthly: number; stdDevAnnual: number
  sharpe: number; sortino: number; maxDrawdown: number; beta: number
  positiveMonths: number; alpha: number
  rolling3Y: RollingPoint[]; rolling5Y: RollingPoint[]
  expenseRatio: number; categoryExpenseRatio: number; exitLoad: number
  navChart: ChartPoint[]
  latestNAV: number; latestDate: string
  totalScore: number; grade: string; verdict: string
  breakdown: ScoreBreakdown[]; tips: string[]
  dataYears: number
}

// ══════════════════════════════════════════════════════════════════════════════
//  MASTER ANALYSE FUNCTION
// ══════════════════════════════════════════════════════════════════════════════
export async function analyseFund(code: number): Promise<FundAnalysis> {
  const { meta, data } = await fetchFund(code)
  if (!data || data.length === 0) throw new Error('No NAV data available')

  const sorted = [...data].sort(
    (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
  )
  const latest    = sorted[0]
  const latestNAV = parseFloat(latest.nav)
  const latestDate = latest.date
  const oldestDate = parseDate(sorted[sorted.length - 1].date)
  const dataYears  = (new Date().getTime() - oldestDate.getTime()) / (365.25 * 24 * 3600 * 1000)

  const nav1Y  = navAtDate(data, yearsAgo(1))
  const nav3Y  = navAtDate(data, yearsAgo(3))
  const nav5Y  = navAtDate(data, yearsAgo(5))
  const nav10Y = navAtDate(data, yearsAgo(10))
  const navAll = parseFloat(sorted[sorted.length - 1].nav)

  const cagr1Y  = nav1Y  ? parseFloat(cagr(nav1Y,  latestNAV, 1).toFixed(2))          : 0
  const cagr3Y  = nav3Y  ? parseFloat(cagr(nav3Y,  latestNAV, 3).toFixed(2))          : 0
  const cagr5Y  = nav5Y  ? parseFloat(cagr(nav5Y,  latestNAV, 5).toFixed(2))          : 0
  const cagr10Y = nav10Y ? parseFloat(cagr(nav10Y, latestNAV, 10).toFixed(2))         : 0
  const cagrAll = dataYears > 0.5 ? parseFloat(cagr(navAll, latestNAV, dataYears).toFixed(2)) : 0

  const mRets     = monthlyReturns(data)
  const sdMonthly = parseFloat(stdDev(mRets).toFixed(2))
  const sdAnnual  = parseFloat((sdMonthly * Math.sqrt(12)).toFixed(2))
  const sharpe    = sharpeRatio(mRets)
  const sortino   = sortinoRatio(mRets)
  const maxDD     = maxDrawdown(data)
  const beta      = estimateBeta(mRets)
  const posMo     = positiveMonthsPct(mRets)
  const alpha     = parseFloat(((cagr5Y || cagr3Y) - 12.5).toFixed(2))

  const rolling3Y = rollingReturns(data, 3)
  const rolling5Y = rollingReturns(data, 5)

  const isDirect = isDirectPlan(meta.scheme_name)
  const expRatio = inferExpenseRatio(meta.scheme_category, isDirect)
  const catExpR  = categoryExpenseRatio(meta.scheme_category)
  const exitLoad = inferExitLoad(meta.scheme_category)
  const navChart = navChartData(data, Math.min(5, dataYears))

  // ── SCORING ────────────────────────────────────────────────────────────────
  const breakdown: ScoreBreakdown[] = []
  let total = 0
  const add = (label: string, score: number, max: number, note: string, good: boolean) => {
    breakdown.push({ label, score, max, note, good }); total += score
  }

  // COST (20)
  const erVsCat = expRatio < catExpR ? 10 : expRatio < catExpR + 0.3 ? 5 : 0
  add('Expense ratio vs category avg', erVsCat, 10,
    erVsCat >= 10 ? `${expRatio}% < category avg ${catExpR}%` : `${expRatio}% ≥ category avg ${catExpR}%`,
    erVsCat >= 7)

  const erAbs = expRatio <= 0.5 ? 10 : expRatio <= 1.0 ? 8 : expRatio <= 1.5 ? 5 : expRatio <= 2.0 ? 2 : 0
  add('Expense ratio level', erAbs, 10,
    expRatio <= 0.5 ? 'Excellent (<0.5%)' : expRatio <= 1.0 ? 'Good (<1%)' : expRatio <= 1.5 ? 'Acceptable' : 'High — erodes wealth',
    erAbs >= 7)

  // RETURNS (30)
  const primaryCagr = cagr5Y || cagr3Y
  const cagrYrs     = cagr5Y ? 5 : 3
  const retScore    = primaryCagr > 20 ? 15 : primaryCagr > 16 ? 13 : primaryCagr > 12 ? 10 : primaryCagr > 10 ? 7 : primaryCagr > 8 ? 4 : primaryCagr > 0 ? 2 : 0
  add(`${cagrYrs}Y CAGR vs benchmark`, retScore, 15,
    primaryCagr > 0 ? `${primaryCagr}% (Nifty 50 benchmark ~12.5%)` : 'Insufficient data', retScore >= 10)

  const alphaScore = alpha > 4 ? 10 : alpha > 2 ? 8 : alpha > 0 ? 5 : alpha > -2 ? 2 : 0
  add('Alpha (manager skill)', alphaScore, 10,
    alpha > 0 ? `+${alpha}% above benchmark` : `${alpha}% below benchmark — index may be better`, alpha > 0)

  const rollPos   = rolling3Y.length > 0 ? (rolling3Y.filter(r => r.return > 0).length / rolling3Y.length) * 100 : 0
  const rollScore = rollPos > 90 ? 5 : rollPos > 75 ? 4 : rollPos > 60 ? 2 : 1
  add('Rolling 3Y consistency', rollScore, 5,
    rolling3Y.length > 0 ? `${rollPos.toFixed(0)}% of 3Y windows positive` : 'Not enough history', rollPos > 75)

  // RISK (35)
  const shScore = sharpe >= 2 ? 10 : sharpe >= 1.5 ? 8 : sharpe >= 1 ? 6 : sharpe >= 0.5 ? 3 : 0
  add('Sharpe ratio', shScore, 10, `${sharpe} (good >1, excellent >2)`, sharpe >= 1)

  const sdScore = sdAnnual < 12 ? 10 : sdAnnual < 16 ? 8 : sdAnnual < 20 ? 5 : sdAnnual < 25 ? 2 : 0
  add('Annual volatility', sdScore, 10, `${sdAnnual}% — ${sdAnnual < 14 ? 'Low' : sdAnnual < 20 ? 'Moderate' : 'High'}`, sdAnnual < 18)

  const ddScore = maxDD < 15 ? 10 : maxDD < 25 ? 7 : maxDD < 35 ? 4 : maxDD < 45 ? 2 : 0
  add('Max drawdown', ddScore, 10, `-${maxDD}% worst peak-to-trough`, maxDD < 30)

  const betaScore = beta >= 0.8 && beta <= 1.1 ? 5 : beta >= 0.7 && beta <= 1.2 ? 3 : 1
  add('Beta', betaScore, 5, `${beta} (healthy: 0.8–1.1)`, beta >= 0.8 && beta <= 1.1)

  // STRUCTURE (15)
  add('Direct vs Regular plan', isDirect ? 5 : 0, 5,
    isDirect ? 'Direct — lowest cost' : 'Regular — broker earns commission on your money', isDirect)

  add('Exit load', exitLoad === 0 ? 5 : exitLoad <= 0.5 ? 3 : exitLoad <= 1 ? 2 : 0, 5,
    exitLoad === 0 ? 'No exit load' : `${exitLoad}% exit load — check before redeeming`, exitLoad === 0)

  add('Positive months %', posMo > 65 ? 5 : posMo > 55 ? 3 : posMo > 45 ? 1 : 0, 5,
    `${posMo}% months positive`, posMo > 60)

  const maxPossible = breakdown.reduce((a, b) => a + b.max, 0)
  const totalScore  = Math.round((total / maxPossible) * 100)
  const grade       = totalScore >= 85 ? 'A+' : totalScore >= 75 ? 'A' : totalScore >= 65 ? 'B+' : totalScore >= 55 ? 'B' : totalScore >= 45 ? 'C' : 'D'
  const verdict     = totalScore >= 80 ? 'Exceptional — strong hold' : totalScore >= 65 ? 'Good — worth continuing' : totalScore >= 50 ? 'Average — review alternatives' : totalScore >= 35 ? 'Below average — consider switching' : 'Poor — switch recommended'

  const tips: string[] = []
  if (!isDirect)          tips.push('Switch to Direct plan immediately. Same fund, ~0.7% lower TER. On ₹5L over 15 years that is ₹3–5 lakhs extra wealth.')
  if (alpha < 0)          tips.push(`Negative alpha of ${alpha}%: a Nifty 50 index fund has outperformed this active fund. Reconsider active fees.`)
  if (sharpe < 1)         tips.push(`Sharpe of ${sharpe} is below 1: risk taken is not being adequately rewarded.`)
  if (maxDD > 35)         tips.push(`Max drawdown ${maxDD}% is high. Ensure this matches your risk tolerance and time horizon.`)
  if (sdAnnual > 22)      tips.push(`High volatility (${sdAnnual}%). Needs 7+ year horizon. Prefer SIP over lump sum.`)
  if (primaryCagr > 0 && primaryCagr < 10) tips.push(`${cagrYrs}Y CAGR of ${primaryCagr}% barely beats inflation. Explore better peers.`)
  if (rollPos < 60 && rolling3Y.length > 0) tips.push(`Only ${rollPos.toFixed(0)}% of 3Y windows positive — cycle-dependent performance.`)
  if (tips.length === 0)  tips.push('Fund passes all major quality checks. Continue holding and review annually.')

  return {
    name: meta.scheme_name, category: meta.scheme_category, fundHouse: meta.fund_house,
    isDirect, schemeCode: code,
    cagr1Y, cagr3Y, cagr5Y, cagr10Y, cagrAll,
    stdDevMonthly: sdMonthly, stdDevAnnual: sdAnnual,
    sharpe, sortino, maxDrawdown: maxDD, beta, positiveMonths: posMo, alpha,
    rolling3Y, rolling5Y,
    expenseRatio: expRatio, categoryExpenseRatio: catExpR, exitLoad,
    navChart, latestNAV, latestDate,
    totalScore, grade, verdict, breakdown, tips,
    dataYears: parseFloat(dataYears.toFixed(1)),
  }
}