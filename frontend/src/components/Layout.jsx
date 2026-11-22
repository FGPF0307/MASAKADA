import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { f } from '../copy/fitur'
import { u } from '../copy/prinsip'
import * as I from './Ikon'
import { BannerOffline } from './Kondisi'
import Logo from './Logo'
import { useUmpan } from './Umpan'
import { aturMode, modeEfektif } from '../lib/tema'

const NAV = [
  { to: '/', end: true, label: t.nav.beranda, Ikon: I.IkonRumah },
  { to: '/pantry', label: t.nav.pantry, Ikon: I.IkonKeranjang },
  { to: '/favorit', label: t.nav.favorit, Ikon: I.IkonHati },
]

const KUBU = (admin) => {
  const m = f.menu
  return [
    [m.grup.masak, [
      ['/jelajahi', m.jelajahi, I.IkonJelajah], ['/resep/siap', m.siap, I.IkonPanci], ['/chef-ai', m.chef, I.IkonChat],
      ['/scan', m.scan, I.IkonKamera, t.kartu.plus], ['/perencana', m.perencana, I.IkonKalender, t.kartu.plus],
    ]],
    [m.grup.aku, [
      ['/profil', m.profil, I.IkonOrang], ['/pencapaian', m.pencapaian, I.IkonPiala], ['/resep-saya', m.resepSaya, I.IkonBuku],
      ['/riwayat', m.riwayat, I.IkonJam], ['/workshop', m.workshop, I.IkonKalender], ['/notifikasi', m.notif, I.IkonLonceng],
    ]],
    [m.grup.lain, [['/pengaturan', m.pengaturan, I.IkonFilter], ['/prinsip-desain', m.prinsip, I.IkonBintang], ...(admin ? [['/admin', m.admin, I.IkonCentang]] : [])]],
  ]
}

// Mengukur tautan aktif (aria-current="page") supaya penanda bisa meluncur ke sana. Tanpa animasi pada ukuran pertama.
function useIndikator() {
  const wadah = useRef(null)
  const { pathname } = useLocation()
  const [ind, setInd] = useState(null)
  useLayoutEffect(() => {
    const el = wadah.current
    const ukur = () => {
      const a = el?.querySelector('[aria-current="page"]')
      if (!a) return setInd(null)
      setInd((prev) => ({ x: a.offsetLeft, y: a.offsetTop, w: a.offsetWidth, h: a.offsetHeight, anim: prev !== null }))
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(el)
    return () => ro.disconnect()
  }, [pathname])
  return [wadah, ind]
}

// turun: sedang menggulir ke bawah (bilah bawah HP bersembunyi); jauh: halaman sudah digulir (pil laptop memadat).
function useScroll() {
  const [s, setS] = useState({ turun: false, jauh: false })
  useEffect(() => {
    let akhir = window.scrollY
    const gulir = () => {
      const y = window.scrollY
      const arah = y > akhir + 6 && y > 120 ? true : y < akhir - 6 ? false : null // null = gerakan kecil, arah tidak berubah
      if (arah !== null || Math.abs(y - akhir) > 6) akhir = y
      // Mengembalikan state lama bila tidak ada yang berubah, jadi React tidak merender ulang tiap kali menggulir.
      setS((p) => (p.turun === (arah ?? p.turun) && p.jauh === y > 24 ? p : { turun: arah ?? p.turun, jauh: y > 24 }))
    }
    window.addEventListener('scroll', gulir, { passive: true })
    return () => window.removeEventListener('scroll', gulir)
  }, [])
  return s
}

const Penanda = ({ ind, className }) =>
  ind && (
    <span
      aria-hidden
      className={`absolute left-0 top-0 ${className} ${ind.anim ? 'transition-[transform,width,height] duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)]' : ''}`}
      style={{ width: ind.w, height: ind.h, transform: `translate(${ind.x}px, ${ind.y}px)` }}
    />
  )

const BtnIkon = ({ label, onClick, children }) => (
  <button aria-label={label} onClick={onClick} className="relative flex size-11 items-center justify-center rounded-full text-neutral-700 transition hover:bg-teks/5 active:scale-90">{children}</button>
)

function LinkAtas({ item }) {
  return (
    <NavLink to={item.to} end={item.end} className={({ isActive }) => `relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-neutral-700 hover:text-sage-gelap'}`}>
      {({ isActive }) => (<><item.Ikon className={`size-5 ${isActive ? 'animate-lenting' : ''}`} />{item.label}</>)}
    </NavLink>
  )
}

function LinkBawah({ item }) {
  return (
    <NavLink to={item.to} end={item.end} className={({ isActive }) => `relative z-10 flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors duration-300 ${isActive ? 'text-sage-gelap' : 'text-neutral-500'}`}>
      {({ isActive }) => (<><item.Ikon className={`size-6 ${isActive ? 'animate-lenting' : ''}`} />{item.label}</>)}
    </NavLink>
  )
}

// Saklar cepat mode gelap/terang di side menu (pilihan "ikut sistem" ada di Pengaturan).
function TombolMode() {
  const [gelap, setGelap] = useState(() => modeEfektif() === 'gelap')
  const ubah = () => {
    aturMode(gelap ? 'terang' : 'gelap')
    setGelap(!gelap)
  }
  return (
    <button onClick={ubah} role="switch" aria-checked={gelap} style={{ animationDelay: '480ms' }} className="animate-masuk-kiri mt-auto flex min-h-12 shrink-0 items-center gap-3 rounded-2xl px-3 text-[15px] font-medium transition hover:bg-teks/5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-kartu text-sage-gelap">{gelap ? <I.IkonMatahari className="size-5" /> : <I.IkonBulan className="size-5" />}</span>
      <span className="flex-1 text-left">{f.menu.modeGelap}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${gelap ? 'bg-sage-gelap' : 'bg-teks/20'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-300 ${gelap ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

// Side menu: meluncur dari kiri, latar memudar, item masuk bergantian. Esc / ketuk latar / pindah halaman menutupnya.
function PanelSamping({ buka, onTutup, profil, belum }) {
  const { keluar } = useAuth()
  const { tanya } = useUmpan()
  const { pathname } = useLocation()
  const [pasang, setPasang] = useState(false)
  const [tampil, setTampil] = useState(false)
  const m = f.menu

  useEffect(() => {
    if (buka) {
      setPasang(true)
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setTampil(true)))
      return () => cancelAnimationFrame(r)
    }
    setTampil(false)
    const w = setTimeout(() => setPasang(false), 450)
    return () => clearTimeout(w)
  }, [buka])

  useEffect(() => { if (buka) onTutup() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!buka) return
    const tombol = (e) => e.key === 'Escape' && onTutup()
    window.addEventListener('keydown', tombol)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', tombol); document.body.style.overflow = '' }
  }, [buka, onTutup])

  if (!pasang) return null
  let n = 0
  return (
    <div className="fixed inset-0 z-[60]">
      <div onClick={onTutup} className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${tampil ? 'opacity-100' : 'opacity-0'}`} />
      <aside role="dialog" aria-modal="true" aria-label={m.judul} className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-krem px-4 pb-6 pt-5 shadow-[8px_0_40px_rgba(27,20,22,0.25)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${tampil ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <Logo className="text-xl" />
          <button autoFocus onClick={onTutup} aria-label={m.tutup} className="flex size-11 items-center justify-center rounded-full bg-kartu shadow-sm transition active:scale-90"><I.IkonTutup className="size-5" /></button>
        </div>

        <Link to="/profil" style={{ animationDelay: '100ms' }} className="animate-masuk-kiri relative mb-5 flex shrink-0 items-center gap-4 overflow-hidden rounded-3xl bg-sage-gelap p-4 text-white">
          <span aria-hidden className="absolute -right-6 -top-8 size-28 rounded-full bg-white/10" />
          <span className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-kartu font-judul text-xl font-bold text-sage-gelap" aria-hidden>{profil.nama.slice(0, 1).toUpperCase()}</span>
          <span className="relative min-w-0">
            <span className="block truncate font-judul text-lg font-semibold">{profil.nama}</span>
            <span className="block text-sm text-white/80">{t.akun.paket[profil.paket]} · {m.poin(profil.poin ?? 0)}</span>
          </span>
        </Link>

        <Link to="/bagikan/info" style={{ animationDelay: '130ms' }} className="animate-masuk-kiri mb-4 flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-teks/10 bg-kartu py-3.5 font-semibold transition active:scale-[0.98]">
          <I.IkonPlus className="size-5" />{m.bagikan}
        </Link>

        {profil.paket !== 'plus' && (
          <Link to="/plus" style={{ animationDelay: '150ms' }} className="animate-masuk-kiri mb-5 flex shrink-0 items-center justify-between gap-3 rounded-2xl bg-emas px-4 py-3 text-sm font-semibold transition active:scale-[0.98]">
            {m.cobaPlus}<I.IkonPanah className="size-4" />
          </Link>
        )}

        <nav aria-label={m.judul} className="shrink-0 space-y-5">
          {KUBU(profil.role === 'admin').map(([judul, daftar]) => (
            <div key={judul} className="space-y-1">
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">{judul}</h2>
              {daftar.map(([to, label, Ikon, tag]) => {
                const i = n++
                return (
                  <NavLink key={to} to={to} style={{ animationDelay: `${200 + i * 35}ms` }} className={({ isActive }) => `animate-masuk-kiri flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[15px] font-medium transition-colors ${isActive ? 'bg-kartu text-sage-gelap shadow-sm' : 'hover:bg-teks/5'}`}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-kartu text-sage-gelap"><Ikon className="size-5" /></span>
                    <span className="flex-1">{label}</span>
                    {tag && profil.paket !== 'plus' && <span className="rounded-full bg-emas px-2 py-0.5 text-[10px] font-semibold">{tag}</span>}
                    {to === '/notifikasi' && belum > 0 && <span className="flex min-w-5 items-center justify-center rounded-full bg-terakota px-1.5 text-[11px] text-white">{belum}</span>}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <TombolMode />
        <button onClick={async () => { if (await tanya(u.keluar)) keluar() }} style={{ animationDelay: '520ms' }} className="animate-masuk-kiri mt-1 flex min-h-12 shrink-0 items-center gap-3 rounded-2xl px-3 text-[15px] font-medium text-terakota transition hover:bg-kurang">
          <span className="flex size-9 items-center justify-center rounded-xl bg-kurang"><I.IkonKeluar className="size-5" /></span>
          {t.akun.keluar}
        </button>
      </aside>
    </div>
  )
}

function PlusSheet({ onClose }) {
  const go = useNavigate()
  const pilih = (to) => {
    onClose()
    go(to)
  }
  return (
    <div className="animate-pudar fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center" onClick={onClose}>
      <div role="dialog" aria-label={t.plus.judul} className="animate-geser-naik w-full space-y-3 rounded-t-3xl bg-kartu p-5 lg:max-w-sm lg:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <button className="flex w-full items-center justify-center gap-2 rounded-full bg-sage-gelap py-3.5 font-semibold text-white transition active:scale-[0.98]" onClick={() => pilih('/pantry/tambah')}><I.IkonKeranjang className="size-5" />{t.plus.tambahBahan}</button>
        <button className="flex w-full items-center justify-center gap-2 rounded-full bg-terakota py-3.5 font-semibold text-white transition active:scale-[0.98]" onClick={() => pilih('/bagikan/info')}><I.IkonBuku className="size-5" />{t.plus.bagikanResep}</button>
        <button className="w-full py-2 text-neutral-600" onClick={onClose}>{t.plus.tutup}</button>
      </div>
    </div>
  )
}

export default function Layout() {
  const [sheet, setSheet] = useState(false)
  const [menu, setMenu] = useState(false)
  const [belum, setBelum] = useState(0)
  const go = useNavigate()
  const { pathname } = useLocation()
  const { profil } = usePreferences()
  const { turun, jauh } = useScroll()
  const [wadahAtas, indAtas] = useIndikator()
  const [wadahBawah, indBawah] = useIndikator()
  const tutupMenu = () => setMenu(false)

  // Lencana notifikasi: diperbarui tiap pindah halaman; galat tidak menghalangi navigasi.
  useEffect(() => { api('/notifikasi').then((d) => setBelum(d.belum_dibaca)).catch(() => {}) }, [pathname])

  // Pintasan untuk pengguna mahir: "/" membuka pencarian (kecuali saat sedang mengetik).
  useEffect(() => {
    const tombol = (e) => {
      if (e.key !== '/' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return
      e.preventDefault()
      go('/cari')
    }
    window.addEventListener('keydown', tombol)
    return () => window.removeEventListener('keydown', tombol)
  }, [go])

  return (
    <div className="min-h-screen">
      <BannerOffline />
      <a href="#utama" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-xl focus:bg-kartu focus:px-4 focus:py-2 focus:shadow">{u.lewatiKonten}</a>

      {/* Laptop: pil melayang di tengah atas. Memadat dan lebih tegas saat halaman digulir. */}
      <nav
        ref={wadahAtas}
        aria-label="Menu utama"
        className={`animate-turun fixed left-1/2 top-4 z-40 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-teks/5 bg-kartu/80 px-3 backdrop-blur-xl transition-all duration-500 lg:flex ${jauh ? 'scale-[0.97] bg-kartu/90 py-1.5 shadow-[0_16px_44px_rgba(27,20,22,0.2)]' : 'py-2 shadow-[0_8px_30px_rgba(27,20,22,0.12)]'}`}
      >
        <Penanda ind={indAtas} className="rounded-full bg-sage-gelap shadow-[0_6px_16px_rgba(27,20,22,0.25)]" />
        <button onClick={() => setMenu(true)} aria-label={f.menu.buka} className="relative z-10 rounded-full pl-2 pr-3 transition active:scale-95"><Logo /></button>
        {NAV.map((i) => <LinkAtas key={i.to} item={i} />)}
        <span aria-hidden className="mx-1 h-6 w-px bg-teks/10" />
        <BtnIkon label={f.menu.cari} onClick={() => go('/cari')}><I.IkonCari className="size-5" /></BtnIkon>
        <BtnIkon label={belum ? `${f.menu.notif}, ${belum} belum dibaca` : f.menu.notif} onClick={() => go('/notifikasi')}>
          <I.IkonLonceng className="size-5" />
          {belum > 0 && <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-terakota px-1 text-[10px] font-semibold leading-4 text-white">{belum}</span>}
        </BtnIkon>
        <BtnIkon label={f.menu.buka} onClick={() => setMenu(true)}><I.IkonMenu className="size-5" /></BtnIkon>
        <button aria-label={t.nav.tambah} onClick={() => setSheet(true)} className="group ml-1 flex items-center gap-2 whitespace-nowrap rounded-full bg-terakota px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--color-terakota)_35%,transparent)] transition hover:-translate-y-0.5 active:scale-95">
          <I.IkonPlus className={`size-4 transition-transform duration-300 group-hover:rotate-90 ${sheet ? 'rotate-45' : ''}`} />{t.nav.tambah}
        </button>
      </nav>

      <main id="utama" tabIndex={-1} className="mx-auto w-full max-w-[1200px] px-4 py-5 pb-32 outline-none lg:px-8 lg:pb-8 lg:pt-28">
        <Outlet context={{ bukaMenu: () => setMenu(true) }} />
      </main>

      {/* HP: bilah bawah mengambang. Penanda meluncur ke tab aktif; bersembunyi saat menggulir ke bawah. */}
      <nav
        ref={wadahBawah}
        aria-label="Menu utama"
        className={`animate-naik-bawah fixed inset-x-3 z-40 flex items-center rounded-3xl border border-teks/5 bg-kartu/90 px-2 py-2 shadow-[0_10px_34px_rgba(27,20,22,0.18)] backdrop-blur-xl transition-[translate,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${turun && !menu && !sheet ? 'translate-y-[150%] opacity-0' : ''}`}
        style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <Penanda ind={indBawah} className="rounded-2xl bg-siap" />
        <LinkBawah item={NAV[0]} />
        <LinkBawah item={NAV[1]} />
        <div className="flex flex-1 justify-center">
          <button aria-label={t.nav.tambah} onClick={() => setSheet(true)} className={`-mt-9 flex size-14 items-center justify-center rounded-full bg-terakota text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--color-terakota)_40%,transparent)] ring-4 ring-krem transition-transform duration-300 active:scale-90 ${sheet ? 'rotate-45' : ''}`}>
            <I.IkonPlus className="size-7" />
          </button>
        </div>
        <LinkBawah item={NAV[2]} />
        <button onClick={() => setMenu(true)} aria-label={f.menu.buka} className="relative z-10 flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium text-neutral-500 transition active:scale-90">
          <span className="relative"><I.IkonMenu className="size-6" />{belum > 0 && <span aria-hidden className="absolute -right-1 -top-0.5 size-2.5 rounded-full bg-terakota ring-2 ring-kartu" />}</span>
          {f.menu.judul}
        </button>
      </nav>

      <PanelSamping buka={menu} onTutup={tutupMenu} profil={profil} belum={belum} />
      {sheet && <PlusSheet onClose={() => setSheet(false)} />}
    </div>
  )
}
