import { Link, useLocation } from 'react-router-dom'
import { t } from '../copy/id'
import { IkonKunci } from './Ikon'

// Halaman yang boleh dibuka tamu apa adanya. Halaman lain diganti AjakMasuk.
// eslint-disable-next-line react-refresh/only-export-components
export const BOLEH_TAMU = ['/', '/jelajahi']
// eslint-disable-next-line react-refresh/only-export-components
export const bolehTamu = (pathname) => BOLEH_TAMU.includes(pathname)

// Pesan disesuaikan dengan halaman yang dituju.
function pesanUntuk(pathname) {
  const a = t.tamu.alasan
  if (pathname.startsWith('/pantry') || pathname === '/scan') return a.pantry
  if (pathname.startsWith('/resep/')) return a.resep
  if (pathname === '/pengaturan') return a.alat
  if (pathname === '/cari' || pathname === '/chef-ai' || pathname === '/perencana') return a.rekomendasi
  if (pathname.startsWith('/bagikan') || pathname === '/resep-saya') return a.bagikan
  return a.umum
}

// Ajakan masuk/daftar untuk tamu. Setelah masuk, pengguna diarahkan kembali ke halaman ini.
export default function AjakMasuk({ pesan }) {
  const { pathname } = useLocation()
  const [judul, isi] = pesan ?? pesanUntuk(pathname)
  const s = t.tamu
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-siap text-sage-gelap"><IkonKunci className="size-7" /></span>
      <h1 className="font-judul text-2xl font-bold">{judul}</h1>
      <p className="text-neutral-600">{isi}</p>
      <div className="flex w-full flex-col gap-2 pt-2">
        <Link to="/daftar" state={{ dari: pathname }} className="rounded-full bg-sage-gelap py-3.5 font-semibold text-white transition active:scale-[0.98]">{s.daftar}</Link>
        <Link to="/masuk" state={{ dari: pathname }} className="rounded-full border border-teks/15 py-3.5 font-semibold transition active:scale-[0.98]">{s.masuk}</Link>
        <Link to="/jelajahi" className="pt-1 text-sm text-sage-gelap">{s.lihatResep}</Link>
      </div>
    </div>
  )
}
