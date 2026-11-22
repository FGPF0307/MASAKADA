import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { api } from '../../api/client'
import { Field, Tombol } from '../../components/Form'
import { Chip, Sakelar, Segmented, StepperKecil } from '../../components/Pilihan'
import PilihFoto from '../../components/PilihFoto'
import { t } from '../../copy/id'

const chipWaktu = (n) => (n <= 15 ? 'kilat' : n <= 30 ? 'cepat' : n <= 60 ? 'sedang' : 'lama')
const angkaAtauNull = (s) => {
  if (s === '') return null
  const n = parseInt(s, 10)
  return Number.isNaN(n) ? undefined : Math.min(240, Math.max(1, n))
}

export default function StepInfo() {
  const { draf, ubah, simpanSekarang } = useOutletContext()
  const go = useNavigate()
  const [alat, setAlat] = useState([])
  const b = t.bagikan
  const total = (draf.menit_persiapan ?? 0) + (draf.menit_memasak ?? 0)

  useEffect(() => {
    api('/alat').then((l) => setAlat(l.filter((a) => !a.diasumsikan_ada))).catch(() => {})
  }, [])

  const waktu = (kolom) => (e) => {
    const n = angkaAtauNull(e.target.value)
    if (n !== undefined) ubah({ [kolom]: n })
  }
  const toggleAlat = (id) => ubah({ alat: draf.alat.includes(id) ? draf.alat.filter((x) => x !== id) : [...draf.alat, id] })
  const lanjut = async () => { if (await simpanSekarang()) go('/bagikan/bahan') }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <p className="text-sm text-neutral-600">{b.foto}</p>
        <PilihFoto url={draf.foto_url} onChange={(u) => ubah({ foto_url: u })} label={t.foto.tambah} />
      </section>

      <Field label={b.judulResep} maxLength={150} value={draf.judul} onChange={(e) => ubah({ judul: e.target.value })} />
      <label className="block space-y-1">
        <span className="text-sm text-neutral-600">{b.deskripsi}</span>
        <textarea rows={2} maxLength={500} value={draf.deskripsi ?? ''} onChange={(e) => ubah({ deskripsi: e.target.value || null })} className="w-full rounded-xl border border-teks/10 bg-kartu px-4 py-3 outline-none focus:border-sage" />
      </label>

      <section className="flex items-center justify-between rounded-2xl bg-kartu p-4">
        <span className="font-medium">{b.porsi}</span>
        <StepperKecil nilai={draf.porsi} max={50} onChange={(v) => ubah({ porsi: v })} />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Field label={b.persiapan} inputMode="numeric" value={draf.menit_persiapan ?? ''} onChange={waktu('menit_persiapan')} />
        <Field label={b.memasak} inputMode="numeric" value={draf.menit_memasak ?? ''} onChange={waktu('menit_memasak')} />
      </div>
      {total > 0 && <p className="rounded-xl bg-siap px-4 py-2 text-sm text-sage-gelap">{b.total(total, t.waktu[chipWaktu(total)])}</p>}

      <section className="space-y-2">
        <p className="text-sm text-neutral-600">{b.kesulitan}</p>
        <Segmented nilai={draf.kesulitan} onChange={(v) => ubah({ kesulitan: v })} opsi={Object.entries(t.kesulitan)} />
      </section>
      <section className="space-y-2">
        <p className="text-sm text-neutral-600">{b.kategori}</p>
        <Segmented nilai={draf.kategori} onChange={(v) => ubah({ kategori: v })} opsi={t.jelajahi.kategori.map((k) => [k, k])} />
      </section>
      <section className="space-y-2">
        <p className="text-sm text-neutral-600">{b.alat}</p>
        <p className="text-xs text-neutral-500">{b.alatIsi}</p>
        <div className="flex flex-wrap gap-2">{alat.map((a) => <Chip key={a.id} aktif={draf.alat.includes(a.id)} onClick={() => toggleAlat(a.id)}>{a.nama}</Chip>)}</div>
      </section>
      <Sakelar label={b.hMinus1} nilai={draf.perlu_h_minus_1} onChange={(v) => ubah({ perlu_h_minus_1: v })} />

      <Tombol onClick={lanjut}>{b.lanjutBahan}</Tombol>
    </div>
  )
}
