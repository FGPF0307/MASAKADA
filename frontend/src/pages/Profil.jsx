import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Pesan, Tombol } from '../components/Form'
import { IkonChevron } from '../components/Ikon'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { f } from '../copy/fitur'
import { rupiah } from '../lib/tampil'
import { useUmpan } from '../components/Umpan'
import { u } from '../copy/prinsip'

const Baris = ({ to, children, sisi }) => (
  <Link to={to} className="flex items-center justify-between gap-3 rounded-2xl bg-kartu p-4 font-medium shadow-[0_1px_6px_rgba(27,20,22,0.06)] transition active:scale-[0.99]">
    <span>{children}</span>
    <span className="flex items-center gap-2">
      {sisi && <span className="rounded-full bg-emas px-2 py-0.5 text-[10px] font-semibold">{sisi}</span>}
      <IkonChevron className="size-4 text-neutral-400" />
    </span>
  </Link>
)

// Profil (spesifikasi 8.11 #41): ringkasan, dampak, dan menu pribadi.
export default function Profil() {
  const { keluar } = useAuth()
  const { tanya } = useUmpan()
  const { profil, galat } = usePreferences()
  const [r, setR] = useState(null)
  const p = f.profil
  const plus = profil.paket === 'plus'

  useEffect(() => { api('/ringkasan-profil').then(setR).catch(() => {}) }, [plus]) // ringkasan saja; galat tidak menghalangi halaman

  return (
    <div className="max-w-md space-y-4">
      <h1 className="font-judul text-3xl font-bold">{t.halaman.profil}</h1>
      <Pesan>{galat}</Pesan>

      <div className="flex items-center gap-4 rounded-2xl bg-kartu p-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-sage-gelap font-judul text-2xl font-bold text-white" aria-hidden>{profil.nama.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{profil.nama}</p>
          {r && <p className="text-sm text-neutral-500">{p.bergabung(new Date(r.bergabung).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }))}</p>}
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-emas px-3 py-0.5 text-xs font-medium">{t.akun.paket[profil.paket]}</span>
            {r && <span className="rounded-full bg-siap px-3 py-0.5 text-xs text-sage-gelap">{r.level}</span>}
          </div>
        </div>
      </div>

      {!plus && (
        <Link to="/plus" className="block rounded-2xl bg-emas/60 p-4">
          <p className="font-medium">{p.cobaPlus}</p>
          <p className="text-sm text-neutral-700">{p.cobaPlusIsi}</p>
        </Link>
      )}

      {r && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[[p.masakan, r.masakan], [p.dibagikan, r.dibagikan], [p.poin, r.poin]].map(([label, n]) => (
              <div key={label} className="rounded-2xl bg-kartu p-3"><p className="font-judul text-2xl font-bold">{n}</p><p className="text-xs text-neutral-500">{label}</p></div>
            ))}
          </div>
          <div className="rounded-2xl bg-sage-gelap p-4 text-white"><p className="font-medium">{p.dampak(r.bahan_bulan_ini)}</p></div>
          <div className="space-y-1 rounded-2xl bg-kartu p-4">
            <p className="font-medium">{p.laporan} {!plus && <span className="ml-1 rounded-full bg-emas px-2 py-0.5 text-[10px] font-semibold">{t.kartu.plus}</span>}</p>
            {plus
              ? <><p className="text-sm">{p.hemat(rupiah(r.uang_dihemat_perkiraan))}</p><p className="text-xs text-neutral-500">{p.hematCatatan}</p></>
              : <p className="text-sm text-neutral-500">{p.laporanIsi}</p>}
          </div>
        </>
      )}

      <Baris to="/pencapaian">{t.pencapaian.judul}</Baris>
      <Baris to="/resep-saya">{t.resepSaya.judul}</Baris>
      <Baris to="/riwayat">{p.menu.riwayat}</Baris>
      <Baris to="/workshop/saya">{p.menu.workshop}</Baris>
      <Baris to="/chef-ai">{r ? p.menu.chef(r.chef.sisa, r.chef.batas) : f.chef.judul}</Baris>
      <Baris to="/perencana" sisi={plus ? null : t.kartu.plus}>{p.menu.perencana}</Baris>
      {profil.role === 'admin' && <Baris to="/admin">{t.admin.menu}</Baris>}
      <Baris to="/pengaturan">{t.pengaturan.judul}</Baris>
      <Tombol variant="garis" onClick={async () => { if (await tanya(u.keluar)) keluar() }}>{t.akun.keluar}</Tombol>
    </div>
  )
}
