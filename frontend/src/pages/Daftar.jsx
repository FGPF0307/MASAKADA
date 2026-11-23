import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Field, HalamanAkun, Pesan, Tombol } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { galatAuth, t } from '../copy/id'

export default function Daftar() {
  const { daftar, google } = useAuth()
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [setuju, setSetuju] = useState(false)
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const a = t.akun
  const { state } = useLocation()

  const kirim = async (e) => {
    e.preventDefault()
    setGalat('')
    if (sandi.length < 8) return setGalat(t.galat.sandiPendek)
    setSibuk(true)
    try {
      await daftar(nama.trim(), email.trim(), sandi) // sesi baru → rute tamu langsung mengarahkan ke aplikasi
    } catch (err) {
      setGalat(err.status ? err.message : galatAuth(err)) // galat dari server kita sudah berbahasa Indonesia
      setSibuk(false)
    }
  }

  return (
    <HalamanAkun judul={a.daftar.judul} isi={a.daftar.isi}>
      <form onSubmit={kirim} className="space-y-4">
        <Field label={a.nama} autoComplete="name" required maxLength={100} value={nama} onChange={(e) => setNama(e.target.value)} />
        <Field label={a.email} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <Field label={a.kataSandi} type="password" autoComplete="new-password" required minLength={8} value={sandi} onChange={(e) => setSandi(e.target.value)} />
          <p className="mt-1 text-xs text-neutral-500">{a.daftar.minimal}</p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required checked={setuju} onChange={(e) => setSetuju(e.target.checked)} className="mt-1" />
          {a.daftar.setuju}
        </label>
        <Pesan>{galat}</Pesan>
        <Tombol type="submit" disabled={sibuk}>{a.daftar.tombol}</Tombol>
      </form>
      <p className="text-center text-sm text-neutral-500">{a.atau}</p>
      <Tombol variant="garis" onClick={() => google().catch((e) => setGalat(galatAuth(e)))}>{a.googleDaftar}</Tombol>
      <p className="text-center text-sm">{a.daftar.sudah} <Link to="/masuk" state={state} className="font-medium text-terakota">{a.daftar.masuk}</Link></p>
      <Link to="/" className="block text-center text-sm text-neutral-500 underline">{t.tamu.lihatLihat}</Link>
    </HalamanAkun>
  )
}
