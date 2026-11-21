import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import AvatarBahan from '../components/AvatarBahan'
import { Field, Pesan, Tombol } from '../components/Form'
import { Segmented } from '../components/Pilihan'
import TombolKembali from '../components/TombolKembali'
import { parseAngka } from '../lib/format'
import { useUmpan } from '../components/Umpan'
import { t } from '../copy/id'
import { u } from '../copy/prinsip'

// Dua mode: /pantry/:id (ubah bahan di pantry) dan /pantry/tambah/:ingredientId (bahan baru ke pantry).
export default function AturBahan() {
  const { id, ingredientId } = useParams()
  const go = useNavigate()
  const [bahan, setBahan] = useState(null) // { nama, sinonim, kategori, satuan, belum_baku }
  const [jumlah, setJumlah] = useState('')
  const [tempat, setTempat] = useState('kulkas')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const s = t.pantry.atur
  const { tampil, tanya } = useUmpan()

  useEffect(() => {
    const muat = async () => {
      if (id) {
        const item = await api(`/pantry/${id}`)
        setBahan(item)
        setJumlah(String(item.jumlah))
        setTempat(item.tempat)
      } else {
        // Bahan yang sudah ada di pantry dibuka sebagai ubah, bukan ditambah dua kali.
        const ada = (await api('/pantry')).find((p) => p.ingredient_id === Number(ingredientId))
        if (ada) return go(`/pantry/${ada.id}`, { replace: true })
        setBahan(await api(`/bahan/${ingredientId}`))
      }
    }
    muat().catch((e) => setGalat(e.message))
  }, [id, ingredientId, go])

  const simpan = async (e) => {
    e.preventDefault()
    const n = parseAngka(jumlah)
    if (!(n > 0)) return setGalat(s.jumlahTidakValid)
    setSibuk(true)
    setGalat('')
    try {
      if (id) await api(`/pantry/${id}`, { method: 'PATCH', body: { jumlah: n, tempat } })
      else await api('/pantry', { method: 'POST', body: { ingredient_id: Number(ingredientId), jumlah: n, tempat } })
      tampil(u.bahanDisimpan)
      go('/pantry')
    } catch (err) {
      setGalat(err.message)
      setSibuk(false)
    }
  }

  const hapus = async () => {
    if (!(await tanya(u.hapusBahan))) return
    setSibuk(true)
    try {
      await api(`/pantry/${id}`, { method: 'DELETE' })
      const kembalikan = () =>
        api('/pantry', { method: 'POST', body: { ingredient_id: bahan.ingredient_id, jumlah: bahan.jumlah, tempat: bahan.tempat } })
          .then(() => { tampil(u.bahanKembali); window.dispatchEvent(new Event('pantry-berubah')) })
          .catch((e) => tampil(e.message))
      tampil(u.bahanDihapus, { urungkan: kembalikan })
      go('/pantry')
    } catch (err) {
      setGalat(err.message)
      setSibuk(false)
    }
  }

  if (!bahan) return galat ? <div className="max-w-md space-y-3"><Pesan>{galat}</Pesan><Link to="/pantry" className="text-sm text-sage-gelap">{s.kembali}</Link></div> : null

  return (
    <form onSubmit={simpan} className="max-w-md space-y-5">
      <TombolKembali ke="/pantry" />
      <div className="flex items-center gap-4 rounded-2xl bg-kartu p-4">
        <AvatarBahan nama={bahan.nama} className="size-16 text-xl" />
        <div className="min-w-0">
          <h1 className="font-judul text-2xl font-bold">{bahan.nama}</h1>
          <p className="text-sm text-neutral-500">{t.kategori[bahan.kategori]}</p>
          {bahan.sinonim.length > 0 && <p className="truncate text-sm text-neutral-500">{bahan.sinonim.join(', ')}</p>}
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Field label={s.jumlah} inputMode="decimal" required autoFocus value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
        </div>
        <span className="mb-3 rounded-xl bg-black/5 px-4 py-3 font-medium" title={s.satuanTerkunci}>{bahan.satuan}</span>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-neutral-600">{s.disimpanDi}</p>
        <Segmented nilai={tempat} onChange={setTempat} opsi={Object.entries(t.tempat)} />
      </div>

      <Pesan>{galat}</Pesan>
      <Tombol type="submit" disabled={sibuk}>{s.simpan}</Tombol>
      {id && <button type="button" onClick={hapus} disabled={sibuk} className="w-full py-2 text-terakota">{s.hapus}</button>}
    </form>
  )
}
