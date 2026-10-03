import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ClipboardCheck,
  Ellipsis,
  Flame,
  LayoutDashboard,
  ListTree,
  Map as MapIcon,
  Moon,
  Plus,
  RotateCcw,
  Settings as SettingsIcon,
  Sun,
  Timer,
} from 'lucide-react'
import { useStore } from '../store'
import { useDerived } from '../hooks'
import { todayStr } from '../lib/dates'
import { Banners } from './Banners'
import { Celebration } from './Celebration'
import { Dialog } from './Primitives'
import { Toasts } from './Toasts'
import { WelcomeBack } from './WelcomeBack'

const NAV = [
  { to: '/', label: 'Today', icon: LayoutDashboard },
  { to: '/log', label: 'Log', icon: Plus },
  { to: '/history', label: 'History', icon: ListTree },
  { to: '/redo', label: 'Redo', icon: RotateCcw },
  { to: '/session', label: 'Session', icon: Timer },
  { to: '/roadmap', label: 'Roadmap', icon: MapIcon },
  { to: '/review', label: 'Review', icon: ClipboardCheck },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]
const MOBILE_MAIN = ['/', '/history', '/redo']
const MORE = NAV.filter((n) => ['/session', '/roadmap', '/review', '/settings'].includes(n.to))

function useReminderNotifications() {
  const d = useDerived()
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  useEffect(() => {
    if (!settings.reminderOn || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const check = () => {
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const s = useStore.getState()
      const today = todayStr(now)
      const loggedToday = s.problems.some((p) => p.date === today)
      if (hhmm >= s.settings.reminderTime && s.settings.lastNotifiedOn !== today && !loggedToday) {
        try {
          new Notification('Pattern Ledger', {
            body: d.streak.current > 0 ? `Keep your ${d.streak.current}-day streak alive. One problem is enough.` : 'Time for your daily problem. Struggle first, then learn.',
            icon: '/icon.svg',
            tag: 'daily-reminder',
          })
        } catch {
          /* notifications can be blocked by the browser; the in-app banner still shows */
        }
        setSettings({ lastNotifiedOn: today })
      }
    }
    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [settings.reminderOn, settings.reminderTime, setSettings, d.streak])
}

function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  return (
    <button
      type="button"
      className={`btn btn-sm ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      {theme === 'dark' ? 'Light' : 'Dark'} theme
    </button>
  )
}

export function Layout() {
  const theme = useStore((s) => s.theme)
  const d = useDerived()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [more, setMore] = useState(false)
  useReminderNotifications()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0C0E11' : '#F3F1EA')
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) return
      if (document.querySelector('dialog[open]')) return
      e.preventDefault()
      navigate('/log')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  useEffect(() => {
    setMore(false)
    window.scrollTo({ top: 0 })
  }, [pathname])

  const redoCount = d.groups.overdue.length + d.groups.dueToday.length
  const quiet = pathname === '/log' || pathname === '/session'

  return (
    <div className="relative z-[1] min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-lime focus:px-4 focus:py-2 focus:text-onlime">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-bg/80 p-5 backdrop-blur md:flex">
        <Link to="/" className="mb-8 block">
          <span className="font-display text-2xl font-extrabold leading-none">
            Pattern<span className="text-lime">.</span>
            <br />
            Ledger
          </span>
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors duration-200 ${
                  isActive ? 'bg-surface text-lime' : 'text-mute hover:bg-surface hover:text-ink'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
              {to === '/redo' && redoCount > 0 && (
                <span className="ml-auto rounded-full bg-ember px-2 font-mono text-[11px] text-white">{redoCount}</span>
              )}
              {to === '/log' && <kbd className="ml-auto rounded border border-line px-1.5 font-mono text-[10px] text-mute">N</kbd>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 font-mono text-sm">
            <Flame size={16} className={d.streak.current > 0 ? 'text-ember' : 'text-mute'} aria-hidden="true" />
            <span className={d.streak.current > 0 ? 'text-ember' : 'text-mute'}>{d.streak.current}-day streak</span>
          </div>
          <ThemeToggle className="w-full" />
        </div>
      </aside>

      <main id="main" className="px-4 pb-32 pt-6 md:pb-16 md:pl-[calc(15rem+2rem)] md:pr-8 md:pt-10">
        <div className="mx-auto max-w-[1200px]">
          {!quiet && (
            <div className="mb-5 empty:hidden">
              <Banners />
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {pathname !== '/log' && (
        <Link
          to="/log"
          aria-label="Log a problem (shortcut N)"
          className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-lime text-onlime shadow-glow transition-transform duration-200 ease-out hover:scale-105 active:scale-95 md:flex"
        >
          <Plus size={26} />
        </Link>
      )}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {NAV.filter((n) => MOBILE_MAIN.includes(n.to))
          .slice(0, 2)
          .map(({ to, label, icon: Icon }) => (
            <MobileTab key={to} to={to} label={label} Icon={Icon} />
          ))}
        <Link
          to="/log"
          aria-label="Log a problem"
          className="mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-lime text-onlime shadow-glow active:scale-95"
        >
          <Plus size={26} />
        </Link>
        <MobileTab to="/redo" label="Redo" Icon={RotateCcw} badge={redoCount} />
        <button
          type="button"
          onClick={() => setMore(true)}
          className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-mute"
        >
          <Ellipsis size={20} aria-hidden="true" />
          More
        </button>
      </nav>

      <Dialog open={more} onClose={() => setMore(false)} title="More">
        <div className="grid gap-2">
          {MORE.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="btn justify-start" onClick={() => setMore(false)}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
          <ThemeToggle className="justify-start" />
        </div>
      </Dialog>

      <WelcomeBack />
      <Celebration />
      <Toasts />
    </div>
  )
}

function MobileTab({ to, label, Icon, badge = 0 }: { to: string; label: string; Icon: typeof Plus; badge?: number }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive ? 'text-lime' : 'text-mute'}`
      }
    >
      <Icon size={20} aria-hidden="true" />
      {label}
      {badge > 0 && (
        <span className="absolute right-[28%] top-1.5 rounded-full bg-ember px-1.5 font-mono text-[10px] text-white">{badge}</span>
      )}
    </NavLink>
  )
}
