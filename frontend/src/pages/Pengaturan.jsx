import { Link } from 'react-router-dom'
import PilihAlat from '../components/PilihAlat'
import PilihBahanPokok from '../components/PilihBahanPokok'
import { Pesan, Tombol } from '../components/Form'
import { Sakelar, Segmented, StepperKecil } from '../components/Pilihan'
import TombolKembali from '../components/TombolKembali'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { useState } from 'react'
import { useUmpan } from '../components/Umpan'
import { f } from '../copy/fitur'
import { u } from '../copy/prinsip'
import { aturMode, aturTema, bacaMode, bacaTema } from '../lib/tema'
import { aturUkuran, bacaUkuran } from '../lib/ukuranTeks'

const Bagian = ({ judul, children }) => (
  <section className="space-y-3 rounded-2xl bg-kartu p-4">
    <h2 className="font-medium">{judul}</h2>
    {children}
  </section>
)

export default function Pengaturan() {
  const { keluar } = useAuth()
  const { profil, galat, perbarui } = usePreferences()
  const s = t.pengaturan
  const { tanya } = useUmpan()
  const [ukuran, setUkuran] = useState(bacaUkuran)
  const [tema, setTema] = useState(bacaTema)
  const [mode, setMode] = useState(bacaMode)

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/profil" />
        <h1 className="font-judul text-3xl font-bold">{s.judul}</h1>
      </div>
      <p className="text-sm text-neutral-500">{s.tersimpan}</p>
      <Pesan>{galat}</Pesan>

      <Link to="/plus" className="flex items-center justify-between gap-3 rounded-2xl bg-emas/60 p-4">
        <span>
          <span className="block font-medium">{profil.paket === 'plus' ? f.paketKartu.plus : f.paketKartu.gratis}</span>
          {profil.paket !== 'plus' && <span className="text-sm">{f.paketKartu.isi}</span>}
        </span>
        <span className="shrink-0 rounded-lg bg-terakota px-3 py-1.5 text-sm text-white">{profil.paket === 'plus' ? f.paketKartu.kelola : f.paketKartu.upgrade}</span>
      </Link>

      <h2 className="pt-2 font-judul text-xl font-bold">{s.memasak}</h2>
      <Bagian judul={s.alat}><PilihAlat termasukKompor otomatis /></Bagian>
      <Bagian judul={s.bahanPokok}><PilihBahanPokok otomatis /></Bagian>
      <Bagian judul={s.keahlian}>
        <Segmented nilai={profil.level_keahlian} onChange={(v) => perbarui({ level_keahlian: v })} opsi={Object.entries(t.keahlian)} />
      </Bagian>
      <Bagian judul={s.porsi}>
        <StepperKecil nilai={profil.porsi_default} onChange={(v) => perbarui({ porsi_default: v })} />
      </Bagian>

      <h2 className="pt-2 font-judul text-xl font-bold">{s.penemuan}</h2>
      <Bagian judul={s.penemuan}>
        <Sakelar label={s.tampilkanKurang1} nilai={profil.tampilkan_kurang1} onChange={(v) => perbarui({ tampilkan_kurang1: v })} />
      </Bagian>

      <h2 className="pt-2 font-judul text-xl font-bold">{s.notifikasi}</h2>
      <Bagian judul={s.notifikasi}>
        <Sakelar label={s.kabarTinjauan} nilai={profil.notif_tinjauan} onChange={(v) => perbarui({ notif_tinjauan: v })} />
      </Bagian>

      <h2 className="pt-2 font-judul text-xl font-bold">{f.tema.judul}</h2>
      <Bagian judul={f.tema.judul}>
        <Segmented nilai={tema} onChange={(k) => { setTema(k); aturTema(k) }} opsi={f.tema.opsi} />
      </Bagian>
      <Bagian judul={f.mode.judul}>
        <Segmented nilai={mode} onChange={(k) => { setMode(k); aturMode(k) }} opsi={f.mode.opsi} />
      </Bagian>

      <h2 className="pt-2 font-judul text-xl font-bold">{u.ukuranTeks}</h2>
      <Bagian judul={u.ukuranTeks}>
        <Segmented nilai={ukuran} onChange={(k) => { setUkuran(k); aturUkuran(k) }} opsi={u.ukuran} />
        <p className="text-xs text-neutral-500">{u.pintasan}</p>
      </Bagian>
      <Link to="/prinsip-desain" className="block rounded-2xl bg-kartu p-4 font-medium">{u.lihatPrinsip}</Link>

      <h2 className="pt-2 font-judul text-xl font-bold">{s.akun}</h2>
      <Tombol variant="garis" onClick={async () => { if (await tanya(u.keluar)) keluar() }}>{t.akun.keluar}</Tombol>
    </div>
  )
}
