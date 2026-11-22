import { useState } from 'react'
import { api } from '../api/client'
import { t } from '../copy/id'
import { Pesan, Tombol } from './Form'

// Melaporkan resep ({recipe_id}) atau komentar ({comment_id}) ke moderator.
export default function LaporSheet({ target, onTutup }) {
  const [alasan, setAlasan] = useState('')
  const [catatan, setCatatan] = useState('')
  const [galat, setGalat] = useState('')
  const [terkirim, setTerkirim] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const l = t.lapor

  const kirim = async () => {
    if (!alasan) return setGalat(l.pilihAlasan)
    setSibuk(true)
    setGalat('')
    try {
      await api('/laporan', { method: 'POST', body: { ...target, alasan, catatan } })
      setTerkirim(true)
    } catch (e) {
      setGalat(e.message)
    }
    setSibuk(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center" onClick={onTutup}>
      <div
        role="dialog"
        aria-label={l.judul}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full space-y-4 overflow-y-auto rounded-t-3xl bg-kartu p-5 lg:max-w-md lg:rounded-2xl"
      >
        {terkirim ? (
          <>
            <p role="status" className="rounded-xl bg-siap px-4 py-3 text-sage-gelap">{l.terkirim}</p>
            <Tombol variant="sage" onClick={onTutup}>{l.tutup}</Tombol>
          </>
        ) : (
          <>
            <h2 className="font-judul text-xl font-bold">{l.judul}</h2>
            <div role="radiogroup" aria-label={l.judul} className="space-y-2">
              {l.alasan.map((a) => (
                <label key={a} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${alasan === a ? 'border-sage-gelap bg-siap' : 'border-teks/10 bg-kartu'}`}>
                  <input type="radio" name="alasan" value={a} checked={alasan === a} onChange={() => setAlasan(a)} className="accent-sage-gelap" />
                  {a}
                </label>
              ))}
            </div>
            <label className="block space-y-1">
              <span className="text-sm text-neutral-600">{l.catatan}</span>
              <textarea rows={3} maxLength={500} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="w-full rounded-xl border border-teks/10 bg-kartu px-4 py-3 outline-none focus:border-sage" />
            </label>
            <p className="text-sm text-neutral-500">{l.info}</p>
            <Pesan>{galat}</Pesan>
            <Tombol onClick={kirim} disabled={sibuk}>{l.kirim}</Tombol>
            <button type="button" className="w-full py-2 text-neutral-500" onClick={onTutup}>{l.tutup}</button>
          </>
        )}
      </div>
    </div>
  )
}
