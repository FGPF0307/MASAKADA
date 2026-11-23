import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Field, HalamanAkun, Pesan, Tombol } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { galatAuth, t } from '../copy/id'

export default function Masuk() {
  const { masuk, google } = useAuth()
  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const a = t.akun
  const { state } = useLocation()

  const kirim = async (e) => {
    e.preventDefault()
    setGalat('')
    setSibuk(true)
    try {
      await masuk(email.trim(), sandi) // rute tamu otomatis mengarahkan ke Beranda
    } catch (err) {
      setGalat(galatAuth(err))
      setSibuk(false)
    }
  }

  return (
    <HalamanAkun judul={a.masuk.judul} isi={t.app.slogan}>
      <form onSubmit={kirim} className="space-y-4">
        <Field label={a.email} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label={a.kataSandi} type="password" autoComplete="current-password" required value={sandi} onChange={(e) => setSandi(e.target.value)} />
        <Link to="/lupa-sandi" className="block text-right text-sm text-sage-gelap">{a.masuk.lupa}</Link>
        <Pesan>{galat}</Pesan>
        <Tombol type="submit" disabled={sibuk}>{a.masuk.tombol}</Tombol>
      </form>
      <p className="text-center text-sm text-neutral-500">{a.atau}</p>
      <Tombol variant="garis" onClick={() => google().catch((e) => setGalat(galatAuth(e)))}>{a.google}</Tombol>
      <p className="text-center text-sm">{a.masuk.baru} <Link to="/daftar" state={state} className="font-medium text-terakota">{a.masuk.buat}</Link></p>
      <Link to="/" className="block text-center text-sm text-neutral-500 underline">{t.tamu.lihatLihat}</Link>
    </HalamanAkun>
  )
}
