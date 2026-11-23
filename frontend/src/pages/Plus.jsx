import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Pesan, Tombol } from '../components/Form'
import { Segmented } from '../components/Pilihan'
import TombolKembali from '../components/TombolKembali'
import { usePreferences } from '../context/PreferencesContext'
import { useUmpan } from '../components/Umpan'
import { f } from '../copy/fitur'
import { u } from '../copy/umpan'

// Paywall MasakAda Plus (spesifikasi 8.12 #45). Pembayaran disimulasikan.
export default function Plus() {
  const { profil, muat } = usePreferences()
  const [paket, setPaket] = useState('tahunan')
  const [st, setSt] = useState(null)
  const [galat, setGalat] = useState('')
  const [info, setInfo] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const p = f.plus
  const { tanya } = useUmpan()
  const anggota = profil.paket === 'plus'

  useEffect(() => { api('/plus/status').then(setSt).catch((e) => setGalat(e.message)) }, [anggota])

  const aksi = async (path, body, ok = '') => {
    setSibuk(true)
    setGalat('')
    setInfo('')
    try {
      await api(path, { method: 'POST', body })
      await muat()
      setInfo(ok)
    } catch (e) { setGalat(e.message) }
    setSibuk(false)
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <TombolKembali />
      <header className="space-y-1">
        <span className="inline-block rounded-full bg-emas px-3 py-0.5 text-xs font-semibold">{p.judul}</span>
        <h1 className="font-judul text-3xl font-bold">{p.tagline}</h1>
        <p className="text-neutral-600">{p.isi}</p>
      </header>

      {anggota && (
        <section className="space-y-3 rounded-2xl bg-sage-gelap p-5 text-white">
          <p className="font-judul text-xl font-bold">{p.aktif}</p>
          {st?.plus_sampai && <p className="text-sm text-white/85">{p.sampai(new Date(st.plus_sampai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))}</p>}
          {st && (
            <ul className="space-y-1 text-sm">
              {Object.entries(st.kuota).map(([k, q]) => <li key={k} className="flex justify-between gap-3"><span>{p.kuotaNama[k]}</span><span>{p.sisa(q.sisa, q.batas)}</span></li>)}
            </ul>
          )}
        </section>
      )}

      <div className="overflow-hidden rounded-2xl bg-kartu">
        <div className="grid grid-cols-[1.6fr_1fr_1fr] bg-teks/5 px-3 py-2 text-xs font-semibold">
          <span>{p.fitur}</span><span>{p.gratis}</span><span className="text-sage-gelap">{p.plus}</span>
        </div>
        {p.baris.map(([nama, g, pl]) => (
          <div key={nama} className="grid grid-cols-[1.6fr_1fr_1fr] gap-1 border-t border-teks/5 px-3 py-2 text-sm">
            <span>{nama}</span><span className="text-neutral-500">{g}</span><span className="font-medium text-sage-gelap">{pl}</span>
          </div>
        ))}
      </div>

      <Pesan>{galat}</Pesan>
      <Pesan jenis="info">{info}</Pesan>

      {anggota ? (
        <Tombol variant="garis" disabled={sibuk} onClick={async () => { if (await tanya(u.berhenti)) aksi('/plus/batal', undefined, u.plusBerhenti) }}>{p.berhenti}</Tombol>
      ) : (
        <section className="space-y-3">
          <Segmented nilai={paket} onChange={setPaket} opsi={[['bulanan', `${p.bulanan} · ${p.hargaBulanan}`], ['tahunan', `${p.tahunan} · ${p.hargaTahunan} (${p.hemat})`]]} />
          <Tombol disabled={sibuk} onClick={() => aksi('/plus/aktifkan', { paket }, u.plusAktif)}>{p.mulai}</Tombol>
          <p className="text-center text-sm text-neutral-500">{p.lalu(paket)}</p>
          <button onClick={() => setInfo(p.pulihkanInfo)} className="block w-full text-center text-sm text-sage-gelap">{p.pulihkan}</button>
        </section>
      )}
      <p className="rounded-xl bg-emas/50 px-4 py-2 text-center text-xs">{p.demo}</p>
    </div>
  )
}
