import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import FotoResep from '../components/FotoResep'
import { Pesan, Tombol } from '../components/Form'
import NilaiModal from '../components/NilaiModal'
import TombolKembali from '../components/TombolKembali'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { parseAngka, takaran } from '../lib/format'

export default function Selesai() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const go = useNavigate()
  const { profil } = usePreferences()
  const [data, setData] = useState(null)
  const [nilai, setNilai] = useState({}) // ingredient_id → teks yang diketik
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [modalNilai, setModalNilai] = useState(false)
  const s = t.selesai
  const porsi = sp.get('porsi')

  useEffect(() => {
    api(`/resep/${id}/selesai-pratinjau${porsi ? `?porsi=${porsi}` : ''}`)
      .then((d) => {
        setData(d)
        setNilai(Object.fromEntries(d.items.map((i) => [i.ingredient_id, String(i.usulan)])))
      })
      .catch((e) => setGalat(e.message))
  }, [id, porsi])

  if (galat && !data) return <div className="mx-auto max-w-md space-y-3 p-4"><TombolKembali ke={`/resep/${id}`} /><Pesan>{galat}</Pesan></div>
  if (!data) return <p className="p-4 text-neutral-500">{t.halaman.memuat}</p>

  const dipakai = (i) => parseAngka(nilai[i.ingredient_id] ?? '')
  const valid = (i) => dipakai(i) >= 0
  const semuaValid = data.items.every(valid)
  const terpakai = data.items.filter((i) => valid(i) && dipakai(i) > 0).length

  // Setelah stok tersimpan: pengguna yang boleh menilai diajak memberi bintang; selain itu kembali ke detail resep.
  const kirim = async (body) => {
    setSibuk(true)
    setGalat('')
    try {
      const hasil = await api(`/resep/${id}/selesai`, { method: 'POST', body: { porsi: data.porsi, ...body } })
      if (hasil.boleh_menilai) setModalNilai(true)
      else go(`/resep/${id}`, { replace: true })
    } catch (e) {
      setGalat(e.message)
      setSibuk(false)
    }
  }
  const simpan = () => kirim({ items: data.items.map((i) => ({ ingredient_id: i.ingredient_id, jumlah_dipakai: dipakai(i) })) })

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pb-32 pt-4">
      <TombolKembali ke={`/resep/${id}`} />
      <div className="overflow-hidden rounded-2xl">
        <FotoResep resep={data.resep} className="aspect-[16/9]" />
      </div>
      <header className="space-y-1">
        <h1 className="font-judul text-3xl font-bold">{s.judul(profil.nama)}</h1>
        <p className="text-neutral-600">{s.isi(data.resep.judul)}</p>
      </header>

      <p className="rounded-2xl bg-sage-gelap px-4 py-3 font-medium text-white">{s.dampak(terpakai, data.bulan_ini + terpakai)}</p>

      <section className="space-y-3">
        <div>
          <h2 className="font-judul text-xl font-bold">{s.stok}</h2>
          <p className="text-sm text-neutral-500">{s.stokIsi}</p>
        </div>
        {data.items.length === 0 && <p className="text-neutral-500">{s.kosong}</p>}
        <ul className="space-y-2">
          {data.items.map((i) => {
            const ok = valid(i)
            const sisa = Math.max(0, Math.round((i.punya - (ok ? dipakai(i) : 0)) * 100) / 100)
            return (
              <li key={i.ingredient_id} className="space-y-1 rounded-xl bg-kartu p-3">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 font-medium">
                    {i.nama}
                    {i.opsional && <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-xs font-normal">{s.opsional}</span>}
                  </span>
                  <input
                    inputMode="decimal"
                    aria-label={`${i.nama} (${i.satuan})`}
                    value={nilai[i.ingredient_id] ?? ''}
                    onChange={(e) => setNilai((n) => ({ ...n, [i.ingredient_id]: e.target.value }))}
                    className={`w-24 rounded-lg border bg-white px-3 py-2 text-right ${ok ? 'border-black/10' : 'border-terakota'}`}
                  />
                  <span className="w-10 text-sm text-neutral-500">{i.satuan}</span>
                </div>
                <p className={`text-sm ${ok ? 'text-neutral-500' : 'text-terakota'}`}>
                  {!ok ? s.angkaTidakValid : sisa === 0 ? s.sisaHabis(i.satuan) : s.sisa(takaran(sisa, i.satuan))}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <Pesan>{galat}</Pesan>

      <div className="fixed inset-x-0 bottom-0 border-t border-black/5 bg-krem/95 px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-3">
          <Tombol variant="garis" className="flex-1" disabled={sibuk} onClick={() => kirim({ lewati: true })}>{s.lewati}</Tombol>
          <Tombol className="flex-[2]" disabled={sibuk || !semuaValid} onClick={simpan}>{s.simpan}</Tombol>
        </div>
      </div>

      {modalNilai && (
        <NilaiModal
          resep={data.resep}
          onTutup={() => go(`/resep/${id}`, { replace: true })}
          onSelesai={() => go(`/resep/${id}/ulasan`, { replace: true })}
        />
      )}
    </div>
  )
}
