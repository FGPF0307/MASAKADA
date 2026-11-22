import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { f } from '../copy/fitur'
import { IkonCentang } from './Ikon'
import Sheet from './Sheet'

// Menyimpan resep ke koleksi (menambah ke koleksi otomatis memfavoritkan resepnya).
export default function SheetKoleksi({ recipeId, onTutup, onSimpan }) {
  const [daftar, setDaftar] = useState(null)
  const [baru, setBaru] = useState('')
  const [galat, setGalat] = useState('')
  const k = f.favorit

  const muat = () => api(`/koleksi?recipe_id=${recipeId}`).then(setDaftar).catch((e) => setGalat(e.message))
  useEffect(() => { muat() }, [recipeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const ubah = async (x) => {
    setGalat('')
    try {
      if (x.ada) await api(`/koleksi/${x.id}/resep/${recipeId}`, { method: 'DELETE' })
      else {
        await api(`/koleksi/${x.id}/resep`, { method: 'POST', body: { recipe_id: recipeId } })
        onSimpan?.()
      }
      await muat()
    } catch (e) { setGalat(e.message) }
  }
  const buat = async (e) => {
    e.preventDefault()
    const nama = baru.trim()
    if (!nama) return
    setGalat('')
    try {
      const x = await api('/koleksi', { method: 'POST', body: { nama } })
      await api(`/koleksi/${x.id}/resep`, { method: 'POST', body: { recipe_id: recipeId } })
      onSimpan?.()
      setBaru('')
      await muat()
    } catch (err) { setGalat(err.message) }
  }

  return (
    <Sheet judul={k.simpanKe} onTutup={onTutup}>
      <h2 className="font-judul text-xl font-bold">{k.simpanKe}</h2>
      {galat && <p role="alert" className="rounded-xl bg-kurang px-4 py-2 text-sm text-terakota">{galat}</p>}
      <ul className="space-y-2">
        {daftar?.map((x) => (
          <li key={x.id}>
            <button onClick={() => ubah(x)} aria-pressed={x.ada} className={`flex w-full items-center justify-between rounded-xl p-3 text-left ${x.ada ? 'bg-siap text-sage-gelap' : 'bg-kartu'}`}>
              <span>{x.nama} <span className="text-sm text-neutral-500">· {k.resep(x.jumlah)}</span></span>
              <span aria-hidden>{x.ada ? <IkonCentang className="size-5" /> : '+'}</span>
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={buat} className="flex gap-2">
        <input value={baru} onChange={(e) => setBaru(e.target.value)} maxLength={60} placeholder={k.namaKoleksi} aria-label={k.namaKoleksi} className="min-w-0 flex-1 rounded-xl border border-teks/10 bg-kartu px-4 py-3 outline-none focus:border-sage" />
        <button className="rounded-xl bg-sage-gelap px-4 text-white disabled:opacity-60" disabled={!baru.trim()}>{k.buat}</button>
      </form>
      <button onClick={onTutup} className="w-full py-2 text-neutral-500">{k.selesai}</button>
    </Sheet>
  )
}
