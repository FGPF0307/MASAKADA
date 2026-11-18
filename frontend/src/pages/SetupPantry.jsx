import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Field } from '../components/Form'
import { Chip } from '../components/Pilihan'
import SetupBingkai from '../components/SetupBingkai'
import { t } from '../copy/id'

const KELOMPOK = ['protein', 'sayur', 'karbohidrat']
const TEMPAT = { protein: 'kulkas', sayur: 'kulkas', karbohidrat: 'suhu_ruang' }
// Jumlah awal per satuan; bisa diubah nanti di Pantry.
const JUMLAH_AWAL = { g: 200, ml: 100, butir: 2 }

export default function SetupPantry() {
  const go = useNavigate()
  const [bahan, setBahan] = useState(null) // { protein: [...], ... }
  const [ada, setAda] = useState(new Set()) // sudah ada di pantry (tidak ditambah dua kali)
  const [pilih, setPilih] = useState(new Set())
  const [q, setQ] = useState('')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const s = t.setup.pantry

  useEffect(() => {
    Promise.all([...KELOMPOK.map((k) => api(`/bahan/kategori/${k}`)), api('/pantry')])
      .then(([...hasil]) => {
        const pantry = hasil.pop()
        setBahan(Object.fromEntries(KELOMPOK.map((k, i) => [k, hasil[i]])))
        const sudah = new Set(pantry.map((p) => p.ingredient_id))
        setAda(sudah)
        setPilih(sudah)
      })
      .catch((e) => setGalat(e.message))
  }, [])

  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase()
    if (!bahan) return {}
    const cocok = (b) => !kata || [b.nama, ...b.sinonim].some((x) => x.toLowerCase().includes(kata))
    return Object.fromEntries(KELOMPOK.map((k) => [k, bahan[k].filter(cocok)]))
  }, [bahan, q])

  const ketuk = (id) =>
    setPilih((p) => {
      const baru = new Set(p)
      baru.has(id) ? baru.delete(id) : baru.add(id)
      return baru
    })

  const lanjut = async () => {
    setSibuk(true)
    setGalat('')
    try {
      const baru = KELOMPOK.flatMap((k) => bahan[k].filter((b) => pilih.has(b.id) && !ada.has(b.id)).map((b) => ({ ...b, k })))
      await Promise.all(
        baru.map((b) => api('/pantry', { method: 'POST', body: { ingredient_id: b.id, jumlah: JUMLAH_AWAL[b.satuan], tempat: TEMPAT[b.k] } })),
      )
      go('/setup/preferensi')
    } catch (e) {
      setGalat(e.message)
      setSibuk(false)
    }
  }

  const kosong = bahan && KELOMPOK.every((k) => !tampil[k].length)
  return (
    <SetupBingkai n={1} judul={s.judul} isi={s.isi} tombol={t.setup.lanjutBahan(pilih.size)} onLanjut={lanjut} sibuk={sibuk || !bahan} galat={galat}>
      <Field label={s.cari} type="search" value={q} onChange={(e) => setQ(e.target.value)} />
      {!bahan && !galat && <p className="text-neutral-500">{t.halaman.memuat}</p>}
      {kosong && <p className="text-neutral-500">{s.kosong}</p>}
      {KELOMPOK.map((k) =>
        tampil[k]?.length ? (
          <section key={k} className="space-y-2">
            <h2 className="font-medium">{s.kelompok[k]}</h2>
            <div className="flex flex-wrap gap-2">
              {tampil[k].map((b) => (
                <Chip key={b.id} aktif={pilih.has(b.id)} disabled={ada.has(b.id)} onClick={() => ketuk(b.id)}>
                  {b.nama}
                </Chip>
              ))}
            </div>
          </section>
        ) : null,
      )}
    </SetupBingkai>
  )
}
