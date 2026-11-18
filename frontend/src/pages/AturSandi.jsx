import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, HalamanAkun, Pesan, Tombol } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { galatAuth, t } from '../copy/id'

// Tujuan tautan "lupa kata sandi": Supabase membuat sesi pemulihan, lalu pengguna memilih sandi baru.
export default function AturSandi() {
  const { session, memuat, aturSandi } = useAuth()
  const go = useNavigate()
  const [sandi, setSandi] = useState('')
  const [galat, setGalat] = useState('')
  const a = t.akun.atur

  if (memuat) return null
  if (!session)
    return (
      <HalamanAkun judul={a.judul}>
        <Pesan>{a.tanpaSesi}</Pesan>
        <Link to="/lupa-sandi" className="block text-center text-sm text-sage-gelap">{t.akun.lupa.judul}</Link>
      </HalamanAkun>
    )

  const kirim = async (e) => {
    e.preventDefault()
    try {
      await aturSandi(sandi)
      go('/')
    } catch (err) {
      setGalat(galatAuth(err))
    }
  }

  return (
    <HalamanAkun judul={a.judul}>
      <form onSubmit={kirim} className="space-y-4">
        <Field label={t.akun.kataSandi} type="password" autoComplete="new-password" required minLength={8} value={sandi} onChange={(e) => setSandi(e.target.value)} />
        <Pesan>{galat}</Pesan>
        <Tombol type="submit">{a.tombol}</Tombol>
      </form>
    </HalamanAkun>
  )
}
