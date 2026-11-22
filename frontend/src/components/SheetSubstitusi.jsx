import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { f } from '../copy/fitur'
import { takaran } from '../lib/format'
import Sheet from './Sheet'

// Tanya Chef AI: pengganti bahan yang kurang (Plus). Kuota baru terpakai saat tombol "Tanya" ditekan.
export default function SheetSubstitusi({ resepId, bahan, porsi, onTutup, onMasak, onBeli }) {
  const [kuota, setKuota] = useState(null)
  const [hasil, setHasil] = useState(null)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState(null)
  const s = f.subs

  useEffect(() => { api('/plus/status').then((d) => setKuota(d.kuota.substitusi)).catch(() => {}) }, [])

  const tanya = async () => {
    setSibuk(true)
    setGalat(null)
    try {
      const d = await api('/chef-ai/substitusi', { method: 'POST', body: { recipe_id: resepId, ingredient_id: bahan.id, porsi } })
      setHasil(d)
      setKuota(d.kuota)
    } catch (e) { setGalat(e) }
    setSibuk(false)
  }

  return (
    <Sheet judul={s.label} onTutup={onTutup}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-sage-gelap px-3 py-0.5 text-xs font-semibold text-white">{s.label}</span>
        {kuota && <span className="rounded-full bg-emas px-3 py-0.5 text-xs font-semibold">{s.plus(kuota.sisa, kuota.batas)}</span>}
      </div>
      <h2 className="font-judul text-xl font-bold">{s.judul(takaran(bahan.butuh, bahan.satuan), bahan.nama)}</h2>
      <p className="text-sm text-neutral-600">{s.berdasarkan}</p>

      {galat && (
        <p role="alert" className="rounded-xl bg-kurang px-4 py-3 text-sm text-terakota">
          {galat.message} {galat.status === 402 && <Link to="/plus" className="underline">{f.plus.lihat}</Link>}
        </p>
      )}

      {!hasil && (
        <>
          <button onClick={tanya} disabled={sibuk || kuota?.sisa === 0} className="w-full rounded-xl bg-terakota py-3 font-medium text-white disabled:opacity-60">{sibuk ? s.mencari : s.tanya}</button>
          <p className="text-center text-xs text-neutral-500">{s.pakaiKuota}</p>
        </>
      )}

      {hasil && (
        <>
          {hasil.pilihan.length === 0 && <p className="rounded-xl bg-kartu p-4 text-sm">{s.kosong}</p>}
          <ul className="space-y-2">
            {hasil.pilihan.map((p) => (
              <li key={p.ingredient_id} className="space-y-1 rounded-xl bg-kartu p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{takaran(p.jumlah, p.satuan)} {p.nama}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.punya ? 'bg-siap text-sage-gelap' : 'bg-teks/5 text-neutral-600'}`}>{p.punya ? s.punya : s.tidakAda}</span>
                </div>
                {p.catatan && <p className="text-sm text-neutral-600">{p.catatan}</p>}
                <span className="inline-block rounded-full bg-emas px-2 py-0.5 text-[10px] font-semibold">{s.saranAI}</span>
              </li>
            ))}
          </ul>
          <p className="rounded-xl bg-emas/50 px-4 py-2 text-xs">{s.disclaimer}</p>
          {hasil.mock && <p className="text-xs text-neutral-500">{f.chef.demoMode}</p>}
          {hasil.pilihan.length > 0 && <button onClick={onMasak} className="w-full rounded-xl bg-sage-gelap py-3 font-medium text-white">{s.pakai}</button>}
          <button onClick={onBeli} className="block w-full text-center text-sm text-sage-gelap">{s.lebihBaikBeli}</button>
        </>
      )}
      <button onClick={onTutup} className="w-full py-2 text-neutral-500">{s.tutup}</button>
    </Sheet>
  )
}
