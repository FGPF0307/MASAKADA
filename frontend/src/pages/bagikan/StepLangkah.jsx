import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { api } from '../../api/client'
import { Tombol } from '../../components/Form'
import { IkonTutup } from '../../components/Ikon'
import { Chip, Segmented } from '../../components/Pilihan'
import PilihFoto from '../../components/PilihFoto'
import { t } from '../../copy/id'

const TIDAK_PASTI = /\b(secukupnya|secukup|sejumput|sesuai selera|seperlunya|sedikit saja)\b/i
const KOSONG = { fase: 'memasak', foto_url: null, instruksi: '', timer_menit: null, bahan: [], alat: [] }
const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

export default function StepLangkah() {
  const { draf, ubah, simpanSekarang } = useOutletContext()
  const go = useNavigate()
  const [alat, setAlat] = useState([])
  const b = t.bagikan

  // Alat yang bisa dipilih per langkah: alat resep ini + alat dasar.
  useEffect(() => { api('/alat').then(setAlat).catch(() => {}) }, [])
  const alatTampil = alat.filter((a) => a.diasumsikan_ada || draf.alat.includes(a.id))

  const set = (langkah) => ubah({ langkah })
  const ubahLangkah = (i, patch) => set(draf.langkah.map((l, n) => (n === i ? { ...l, ...patch } : l)))
  const geser = (i, d) => {
    const baru = [...draf.langkah]
    ;[baru[i], baru[i + d]] = [baru[i + d], baru[i]]
    set(baru)
  }
  const lanjut = async () => { if (await simpanSekarang()) go('/bagikan/pratinjau') }

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-600">{b.langkahInfo}</p>
      <ol className="space-y-4">
        {draf.langkah.map((l, i) => {
          const kata = l.instruksi.match(TIDAK_PASTI)?.[0]
          return (
            <li key={i} className="space-y-3 rounded-2xl bg-kartu p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-judul text-lg font-bold">{b.langkahKe(i + 1)}</h2>
                <div className="flex gap-1">
                  <button disabled={i === 0} onClick={() => geser(i, -1)} aria-label={b.naik} className="size-9 rounded-lg border border-black/10 disabled:opacity-30">↑</button>
                  <button disabled={i === draf.langkah.length - 1} onClick={() => geser(i, 1)} aria-label={b.turun} className="size-9 rounded-lg border border-black/10 disabled:opacity-30">↓</button>
                  <button onClick={() => set(draf.langkah.filter((_, n) => n !== i))} aria-label={`${b.hapusLangkah} ${i + 1}`} className="flex size-9 items-center justify-center rounded-lg border border-terakota/40 text-terakota"><IkonTutup className="size-4" /></button>
                </div>
              </div>
              <Segmented nilai={l.fase} onChange={(fase) => ubahLangkah(i, { fase })} opsi={Object.entries(t.detail.fase)} />
              <div className="space-y-1">
                <PilihFoto url={l.foto_url} onChange={(u) => ubahLangkah(i, { foto_url: u })} label={b.fotoLangkah} />
                {!l.foto_url && <p className="text-xs text-terakota">{b.langkahKe(i + 1)} butuh foto</p>}
              </div>
              <label className="block space-y-1">
                <span className="text-sm text-neutral-600">{b.instruksi}</span>
                <textarea rows={3} maxLength={1000} value={l.instruksi} onChange={(e) => ubahLangkah(i, { instruksi: e.target.value })} className={`w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-sage ${kata ? 'border-terakota' : 'border-black/10'}`} />
                {kata && <span role="alert" className="text-xs text-terakota">Takaran harus pasti: ganti "{kata}" dengan angka + satuan.</span>}
              </label>
              <label className="flex items-center gap-3 text-sm">
                <span className="text-neutral-600">{b.timer}</span>
                <input
                  inputMode="numeric"
                  value={l.timer_menit ?? ''}
                  onChange={(e) => { const n = parseInt(e.target.value, 10); ubahLangkah(i, { timer_menit: e.target.value === '' ? null : Number.isNaN(n) ? l.timer_menit : Math.min(240, Math.max(1, n)) }) }}
                  className="w-20 rounded-lg border border-black/10 bg-white px-3 py-2"
                />
              </label>
              {draf.bahan.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-neutral-600">{b.bahanLangkah}</p>
                  <div className="flex flex-wrap gap-2">{draf.bahan.map((x) => <Chip key={x.ingredient_id} aktif={l.bahan.includes(x.ingredient_id)} onClick={() => ubahLangkah(i, { bahan: toggle(l.bahan, x.ingredient_id) })}>{x.nama}</Chip>)}</div>
                </div>
              )}
              {alatTampil.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-neutral-600">{b.alatLangkah}</p>
                  <div className="flex flex-wrap gap-2">{alatTampil.map((a) => <Chip key={a.id} aktif={l.alat.includes(a.id)} onClick={() => ubahLangkah(i, { alat: toggle(l.alat, a.id) })}>{a.nama}</Chip>)}</div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <button onClick={() => set([...draf.langkah, { ...KOSONG, fase: draf.langkah.length ? 'memasak' : 'persiapan' }])} className="w-full rounded-xl border border-dashed border-sage py-3 text-sage-gelap">{b.tambahLangkah}</button>
      <Tombol onClick={lanjut}>{b.pratinjau}</Tombol>
    </div>
  )
}
