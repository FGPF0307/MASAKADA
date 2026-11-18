import { Link } from 'react-router-dom'
import { Pesan, Tombol } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'

// Sementara: nama + paket + Pengaturan + Keluar. Dilengkapi di Langkah 12.
export default function Profil() {
  const { keluar } = useAuth()
  const { profil, galat } = usePreferences()

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="font-judul text-3xl font-bold">{t.halaman.profil}</h1>
      <Pesan>{galat}</Pesan>
      <div className="rounded-2xl bg-kartu p-4">
        <p className="text-lg font-semibold">{profil.nama}</p>
        <span className="inline-block mt-1 rounded-full bg-emas px-3 py-0.5 text-xs font-medium">
          {t.akun.paket[profil.paket]}
        </span>
      </div>
      <Link to="/pengaturan" className="block rounded-2xl bg-kartu p-4 font-medium">{t.pengaturan.judul}</Link>
      <Tombol variant="garis" onClick={keluar}>{t.akun.keluar}</Tombol>
    </div>
  )
}
