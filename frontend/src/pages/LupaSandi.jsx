import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, HalamanAkun, Pesan, Tombol } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { galatAuth, t } from '../copy/id'

export default function LupaSandi() {
  const { lupaSandi } = useAuth()
  const [email, setEmail] = useState('')
  const [galat, setGalat] = useState('')
  const [info, setInfo] = useState('')
  const a = t.akun.lupa

  const kirim = async (e) => {
    e.preventDefault()
    setGalat('')
    try {
      await lupaSandi(email.trim())
      setInfo(a.terkirim)
    } catch (err) {
      setGalat(galatAuth(err))
    }
  }

  return (
    <HalamanAkun judul={a.judul} isi={a.isi}>
      <form onSubmit={kirim} className="space-y-4">
        <Field label={t.akun.email} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Pesan>{galat}</Pesan>
        <Pesan jenis="info">{info}</Pesan>
        <Tombol type="submit">{a.tombol}</Tombol>
      </form>
      <Link to="/masuk" className="block text-center text-sm text-sage-gelap">{a.kembali}</Link>
    </HalamanAkun>
  )
}
