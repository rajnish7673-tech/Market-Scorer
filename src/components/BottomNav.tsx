import Link from 'next/link'
import { Search, BookOpen } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: 'var(--ink-2)', borderTop: '1px solid #ffffff10',
      paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', justifyContent: 'space-around', paddingTop: 8 }}>
        <Link href="/" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          padding: '8px 16px', textDecoration: 'none', cursor: 'pointer', minWidth: '60px',
          opacity: pathname === '/' ? 1 : 0.5,
          transition: 'opacity 200ms',
        }}>
          <Search size={20} color={pathname === '/' ? '#4F3FFF' : '#ffffff80'} />
          <span style={{ fontSize: 10, fontWeight: 600, color: pathname === '/' ? '#4F3FFF' : '#ffffff80' }}>Search</span>
        </Link>

        <Link href="/learn" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          padding: '8px 16px', textDecoration: 'none', cursor: 'pointer', minWidth: '60px',
          opacity: pathname === '/learn' ? 1 : 0.5,
          transition: 'opacity 200ms',
        }}>
          <BookOpen size={20} color={pathname === '/learn' ? '#4F3FFF' : '#ffffff80'} />
          <span style={{ fontSize: 10, fontWeight: 600, color: pathname === '/learn' ? '#4F3FFF' : '#ffffff80' }}>Learn</span>
        </Link>
      </div>
    </div>
  )
}
