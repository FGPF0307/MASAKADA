import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, kirimBlob } from '../api/client'
import { Pesan, Tombol } from '../components/Form'
import { Segmented } from '../components/Pilihan'
import TombolKembali from '../components/TombolKembali'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { useUmpan } from '../components/Umpan'
import { f } from '../copy/fitur'
import { u } from '../copy/prinsip'
import { kompresFoto } from '../lib/kompresFoto'
import { parseAngka } from '../lib/format'

// Scan dengan Chef AI (Plus): foto → daftar bahan → pengguna mengecek → baru masuk pantry.
export default function Scan() {
  const { profil } = usePreferences()
  const go = useNavigate()
  const { tampil } = useUmpan()
  const input = useRef(null)
  const [fase, setFase] = useState('awal') // awal | memindai | hasil
  const [kuota, setKuota] = useState(null)
  const [items, setItems] = useState([])
  const [mock, setMock] = useState(false)
  const [tempat, setTempat] = useState('kulkas')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const s = f.scan
  const plus = profil.paket === 'plus'

  useEffect(() => { if (plus) api('/plus/status').then((d) => setKuota(d.kuota.scan)).catch(() => {}) }, [plus])

  const pilih = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setGalat('')
    setFase('memindai')
    try {
      const d = await kirimBlob('/chef-ai/scan', await kompresFoto(file))
      setItems(d.items.map((x) => ({ ...x, pilih: true, teks: String(x.jumlah) })))
      setKuota(d.kuota)
      setMock(d.mock)
      setFase('hasil')
    } catch (err) {
      setGalat(err.message)
      setFase('awal')
    }
  }
  const ubah = (i, patch) => setItems((l) => l.map((x, n) => (n === i ? { ...x, ...patch } : x)))
  const dipilih = items.filter((x) => x.pilih && parseAngka(x.teks) > 0)

  const simpan = async () => {
    setSibuk(true)
    setGalat('')
    try {
      await api('/chef-ai/scan/konfirmasi', { method: 'POST', body: { tempat, items: dipilih.map((x) => ({ ingredient_id: x.ingredient_id, jumlah: parseAngka(x.teks) })) } })
      tampil(u.scanTersimpan(dipilih.length))
      go('/pantry')
    } catch (err) { setGalat(err.message) }
    setSibuk(false)
  }

  if (!plus)
    return (
      <div className="mx-auto max-w-md space-y-4">
        <TombolKembali />
        <h1 className="font-judul text-3xl font-bold">{s.judul}</h1>
        <p className="rounded-2xl bg-emas/50 p-4">{s.khusus}</p>
        <Link to="/plus" className="block rounded-xl bg-terakota py-3 text-center font-medium text-white">{f.plus.lihat}</Link>
      </div>
    )

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/pantry" />
        <h1 className="font-judul text-3xl font-bold">{s.judul}</h1>
      </div>
      {kuota && <span className="inline-block rounded-full bg-emas px-3 py-1 text-xs font-semibold">{s.pil(kuota.sisa, kuota.batas)}</span>}
      <Pesan>{galat}</Pesan>
      <input ref={input} type="file" accept="image/*" capture="environment" onChange={pilih} className="hidden" />

      {fase !== 'hasil' && (
        <div className="space-y-3 rounded-2xl bg-kartu p-5 text-center">
          <p className="text-neutral-600">{s.sub}</p>
          <button onClick={() => input.current.click()} disabled={fase === 'memindai' || kuota?.sisa === 0} className="w-full rounded-xl bg-terakota py-3 font-medium text-white disabled:opacity-60">
            {fase === 'memindai' ? s.memindai : s.ambil}
          </button>
        </div>
      )}

      {fase === 'hasil' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-judul text-xl font-bold">{s.ditemukan(items.length)}</h2>
            <span className="rounded-full bg-emas px-3 py-0.5 text-xs font-semibold">{s.ai}</span>
          </div>
          <p className="text-sm text-neutral-600">{s.dicocokkan}</p>
          {mock && <p className="text-xs text-neutral-500">{s.demoMode}</p>}
          {items.length === 0 && <p className="rounded-xl bg-kartu p-4 text-sm">{s.kosong}</p>}
          <ul className="space-y-2">
            {items.map((x, i) => (
              <li key={x.ingredient_id} className="flex items-center gap-3 rounded-xl bg-kartu p-3">
                <input type="checkbox" checked={x.pilih} onChange={(e) => ubah(i, { pilih: e.target.checked })} aria-label={x.nama} className="size-5 accent-sage-gelap" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{x.nama}</span>
                  {!x.yakin && <span className="text-xs text-terakota">{s.tidakYakin}</span>}
                </span>
                <input inputMode="decimal" value={x.teks} onChange={(e) => ubah(i, { teks: e.target.value })} aria-label={`${s.jumlah} ${x.nama}`} className="w-20 rounded-lg border border-black/10 bg-white px-2 py-2 text-right" />
                <span className="w-9 text-sm text-neutral-500">{x.satuan}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <p className="text-sm text-neutral-600">{s.simpanDi}</p>
            <Segmented nilai={tempat} onChange={setTempat} opsi={Object.entries(t.tempat)} />
          </div>
          <Tombol variant="sage" disabled={sibuk || !dipilih.length} onClick={simpan}>{s.tambah}</Tombol>
          <Tombol variant="garis" onClick={() => setFase('awal')}>{s.ulang}</Tombol>
        </section>
      )}
    </div>
  )
}
