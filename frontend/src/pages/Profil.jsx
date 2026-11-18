import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Pesan, Tombol } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { t } from '../copy/id'

// Sementara: nama + paket + tombol Keluar. Dilengkapi di Langkah 12.
export default function Profil() {
  const { keluar } = useAuth()
  const [profil, setProfil] = useState(null)
  const [galat, setGalat] = useState('')

  useEffect(() => {
    api('/saya').then(setProfil).catch((e) => setGalat(e.message))
  }, [])

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="font-judul text-3xl font-bold">{t.halaman.profil}</h1>
      <Pesan>{galat}</Pesan>
      {profil ? (
        <div className="rounded-2xl bg-kartu p-4">
          <p className="text-lg font-semibold">{profil.nama}</p>
          <span className="inline-block mt-1 rounded-full bg-emas px-3 py-0.5 text-xs font-medium">
            {t.akun.paket[profil.paket]}
          </span>
        </div>
      ) : (
        !galat && <p className="text-neutral-500">{t.halaman.memuat}</p>
      )}
      <Tombol variant="garis" onClick={keluar}>{t.akun.keluar}</Tombol>
    </div>
  )
}
