import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { t } from '../copy/id'
import Logo from './Logo'

const Ikon = ({ children }) => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
)

const items = [
  { to: '/', label: t.nav.beranda, end: true, ikon: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  { to: '/pantry', label: t.nav.pantry, ikon: <><path d="M5 9h14l-1.5 10a2 2 0 0 1-2 1.7h-7a2 2 0 0 1-2-1.7z" /><path d="M8 9l3-5M16 9l-3-5" /></> },
  { to: '/favorit', label: t.nav.favorit, ikon: <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" /> },
  { to: '/profil', label: t.nav.profil, ikon: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> },
]

// bawah: ikon di atas label (HP/tablet); samping: ikon di kiri label (laptop).
function MenuLink({ item, samping }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        samping
          ? `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-siap text-sage-gelap' : 'text-neutral-600 hover:bg-black/5'}`
          : `flex flex-1 flex-col items-center gap-1 py-1 text-[11px] font-medium transition-colors ${isActive ? 'text-sage-gelap' : 'text-neutral-500'}`
      }
    >
      {({ isActive }) => (
        <>
          <span className={samping ? '' : `rounded-full px-4 py-1 transition-colors ${isActive ? 'bg-siap' : ''}`}>
            <Ikon>{item.ikon}</Ikon>
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  )
}

function PlusSheet({ onClose }) {
  const go = useNavigate()
  const pilih = (to) => {
    onClose()
    go(to)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-label={t.plus.judul}
        className="w-full lg:max-w-sm bg-kartu rounded-t-3xl lg:rounded-2xl p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="w-full rounded-xl bg-sage-gelap text-white py-3" onClick={() => pilih('/pantry/tambah')}>
          {t.plus.tambahBahan}
        </button>
        <button className="w-full rounded-xl bg-terakota text-white py-3" onClick={() => pilih('/bagikan/info')}>
          {t.plus.bagikanResep}
        </button>
        <button className="w-full py-2 text-neutral-500" onClick={onClose}>
          {t.plus.tutup}
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const [sheet, setSheet] = useState(false)
  const tombolPlus = (className, isi) => (
    <button aria-label={t.nav.tambah} onClick={() => setSheet(true)} className={`bg-terakota text-white shadow-lg active:scale-95 transition-transform ${className}`}>
      {isi}
    </button>
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex flex-col gap-1 w-60 shrink-0 p-5 border-r border-black/5 sticky top-0 h-screen">
        <div className="mb-6 px-2"><Logo /></div>
        {items.map((i) => <MenuLink key={i.to} item={i} samping />)}
        <div className="mt-4">{tombolPlus('w-full rounded-xl py-3 text-sm font-medium', `+ ${t.nav.tambah}`)}</div>
      </aside>

      <main className="flex-1 pb-32 lg:pb-8 px-4 py-5 lg:px-8 mx-auto w-full max-w-[1200px]">
        <Outlet />
      </main>

      {/* Bilah mengambang: sudut membulat, bayangan, tombol + menonjol di tengah. */}
      <nav
        className="lg:hidden fixed inset-x-3 z-40 flex items-center rounded-3xl border border-black/5 bg-kartu px-2 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        {items.slice(0, 2).map((i) => <MenuLink key={i.to} item={i} />)}
        <div className="flex flex-1 justify-center">
          {tombolPlus('-mt-9 flex size-14 items-center justify-center rounded-full text-3xl leading-none ring-4 ring-krem', '+')}
        </div>
        {items.slice(2).map((i) => <MenuLink key={i.to} item={i} />)}
      </nav>

      {sheet && <PlusSheet onClose={() => setSheet(false)} />}
    </div>
  )
}
