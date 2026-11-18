import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { t } from '../copy/id'
import Logo from './Logo'

const items = [
  { to: '/', label: t.nav.beranda, end: true },
  { to: '/pantry', label: t.nav.pantry },
  { to: '/favorit', label: t.nav.favorit },
  { to: '/profil', label: t.nav.profil },
]

const linkClass = ({ isActive }) =>
  `flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-3 py-2 rounded-xl text-xs lg:text-sm font-medium ${
    isActive ? 'text-sage-gelap lg:bg-siap' : 'text-neutral-500'
  }`

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
        className="w-full lg:max-w-sm bg-kartu rounded-t-2xl lg:rounded-2xl p-5 space-y-3"
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
  const plus = (
    <button
      aria-label={t.nav.tambah}
      onClick={() => setSheet(true)}
      className="size-12 -mt-6 lg:mt-0 lg:w-full lg:h-auto lg:py-3 rounded-full lg:rounded-xl bg-terakota text-white text-2xl lg:text-sm font-medium shadow"
    >
      <span className="lg:hidden">+</span>
      <span className="hidden lg:inline">+ {t.nav.tambah}</span>
    </button>
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex flex-col gap-2 w-60 shrink-0 p-5 border-r border-black/5 sticky top-0 h-screen">
        <div className="mb-6"><Logo /></div>
        {items.map((i) => (
          <NavLink key={i.to} {...i} className={linkClass}>{i.label}</NavLink>
        ))}
        <div className="mt-4">{plus}</div>
      </aside>

      <main className="flex-1 pb-24 lg:pb-8 px-4 py-5 lg:px-8 mx-auto w-full max-w-[1200px]">
        <Outlet />
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-kartu border-t border-black/5 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.slice(0, 2).map((i) => (
          <NavLink key={i.to} {...i} className={linkClass}>{i.label}</NavLink>
        ))}
        {plus}
        {items.slice(2).map((i) => (
          <NavLink key={i.to} {...i} className={linkClass}>{i.label}</NavLink>
        ))}
      </nav>

      {sheet && <PlusSheet onClose={() => setSheet(false)} />}
    </div>
  )
}
