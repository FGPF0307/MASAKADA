import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { Pesan, Tombol } from '../components/Form'
import { Galat, Memuat } from '../components/Kondisi'
import { Segmented } from '../components/Pilihan'
import TombolKembali from '../components/TombolKembali'
import { f } from '../copy/fitur'
import { rupiah, tglWib } from '../lib/tampil'

// Daftar & bayar workshop (spesifikasi 8.10 #38). Pembayaran disimulasikan.
export default function WorkshopDaftar() {
  const { id } = useParams()
  const [d, setD] = useState(null)
  const [galatMuat, setGalatMuat] = useState(null)
  const [metode, setMetode] = useState('qris')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [hasil, setHasil] = useState(null)
  const w = f.workshop

  useEffect(() => { api(`/workshop/${id}`).then(setD).catch(setGalatMuat) }, [id])
  if (galatMuat && !d) return <Galat apa="workshop ini" onCoba={() => location.reload()} />
  if (!d) return <Memuat n={1} />

  const bayar = async () => {
    setSibuk(true)
    setGalat('')
    try {
      setHasil(await api(`/workshop/${id}/daftar`, { method: 'POST', body: { jenis_tiket: d.tiket.jenis, metode_bayar: d.tiket.harga > 0 ? metode : undefined } }))
    } catch (e) { setGalat(e.message) }
    setSibuk(false)
  }

  if (hasil)
    return (
      <div className="mx-auto max-w-md space-y-4 py-8 text-center">
        <h1 className="font-judul text-3xl font-bold">{w.berhasil}</h1>
        <p className="text-neutral-600">{d.judul}</p>
        <div className="rounded-2xl bg-siap p-5">
          <p className="text-sm text-sage-gelap">{w.kodeTiket}</p>
          <p className="font-judul text-3xl font-bold tracking-widest text-sage-gelap">{hasil.kode_tiket}</p>
        </div>
        <Link to="/workshop/saya" className="block rounded-xl bg-terakota py-3 font-medium text-white">{w.lihatTiket}</Link>
      </div>
    )

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center gap-3">
        <TombolKembali ke={`/workshop/${id}`} />
        <h1 className="font-judul text-2xl font-bold">{w.daftar}</h1>
      </div>
      <section className="rounded-2xl bg-kartu p-4">
        <p className="font-medium">{d.judul}</p>
        <p className="text-sm text-neutral-500">{tglWib(d.mulai)}</p>
      </section>
      <section className="space-y-1 rounded-2xl bg-white p-4">
        <p className="text-sm text-neutral-500">{w.tiket}</p>
        <p className="font-medium">{d.tiket.jenis === 'plus' ? w.tiketPlus : d.tiket.harga < d.harga ? w.diskonPlus : w.reguler}</p>
        <p className="text-sm text-neutral-500">{w.regulerIsi}</p>
        <p className="font-judul text-2xl font-bold">{rupiah(d.tiket.harga)}</p>
      </section>
      {d.tiket.harga > 0 && (
        <section className="space-y-2">
          <p className="text-sm text-neutral-600">{w.bayarDengan}</p>
          <Segmented nilai={metode} onChange={setMetode} opsi={w.metode} />
        </section>
      )}
      <Pesan>{galat}</Pesan>
      <Tombol disabled={sibuk} onClick={bayar}>{w.bayar(rupiah(d.tiket.harga))}</Tombol>
      <p className="rounded-xl bg-emas/50 px-4 py-2 text-center text-xs">{w.hanyaDemo}</p>
    </div>
  )
}
