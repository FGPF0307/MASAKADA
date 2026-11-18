import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import FotoResep from '../components/FotoResep'
import { Pesan } from '../components/Form'
import { StepperKecil } from '../components/Pilihan'
import SheetTokoMitra from '../components/SheetTokoMitra'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'
import { angka, takaran } from '../lib/format'

const Kotak = ({ judul, isi }) => (
  <div className="flex-1 rounded-xl bg-kartu p-3 text-center">
    <p className="text-xs text-neutral-500">{judul}</p>
    <p className="font-medium">{isi}</p>
  </div>
)

function StatusBahan({ b }) {
  const s = t.detail.status
  if (b.status === 'kurang_jumlah')
    return <span className="rounded-full bg-emas px-3 py-1 text-xs">{s.kurang_jumlah(takaran(b.punya, b.satuan), takaran(b.butuh, b.satuan))}</span>
  const gaya = { pokok: 'bg-siap text-sage-gelap', ada: 'bg-siap text-sage-gelap', tidak_ada: 'bg-kurang text-terakota', opsional: 'bg-black/5 text-neutral-600' }
  return <span className={`rounded-full px-3 py-1 text-xs ${gaya[b.status]}`}>{s[b.status]}</span>
}

export default function DetailResep() {
  const { id } = useParams()
  const [sp, setSp] = useSearchParams()
  const [r, setR] = useState(null)
  const [galat, setGalat] = useState('')
  const [mitra, setMitra] = useState(false)
  const d = t.detail
  const porsi = sp.get('porsi')

  // Data lama tetap tampil saat memuat ulang karena porsi berubah.
  useEffect(() => {
    api(`/resep/${id}${porsi ? `?porsi=${porsi}` : ''}`).then(setR).catch((e) => setGalat(e.message))
  }, [id, porsi])

  if (galat && !r) return <div className="max-w-md space-y-3"><Pesan>{galat}</Pesan><Link to="/" className="text-sm text-sage-gelap">{d.kembali}</Link></div>
  if (!r) return <p className="text-neutral-500">{t.halaman.memuat}</p>

  const kurang = r.ringkasan.bahan_kurang
  const kelompok = ['utama', 'opsional', 'bumbu_dasar'].map((p) => [p, r.bahan.filter((b) => b.peran === p)]).filter(([, l]) => l.length)

  return (
    <article className="mx-auto max-w-2xl space-y-5 pb-4">
      <div className="relative -mx-4 overflow-hidden lg:mx-0 lg:rounded-2xl">
        <FotoResep resep={r} className="aspect-[16/10]" />
        <TombolKembali className="absolute left-4 top-4 bg-white/90" />
        {r.eksklusif && <span className="absolute right-4 top-4 rounded-full bg-emas px-3 py-1 text-xs font-semibold">{t.kartu.plus}</span>}
      </div>

      <header className="space-y-1">
        <h1 className="font-judul text-3xl font-bold">{r.judul}</h1>
        <p className="text-neutral-600">{d.oleh(r.penulis, r.penulis_level)}</p>
        <p className="text-sm text-neutral-600">
          {r.jumlah_ulasan > 0 && <span>★ {angka(r.rating_rata)} ({r.jumlah_ulasan}) · </span>}
          {d.dicoba(r.dicoba_orang)}
        </p>
      </header>

      <div className="flex gap-2">
        <Kotak judul={d.persiapan} isi={t.kartu.mnt(r.menit_persiapan)} />
        <Kotak judul={d.memasak} isi={t.kartu.mnt(r.menit_memasak)} />
        <Kotak judul={d.total} isi={`${t.kartu.mnt(r.total)} · ${t.waktu[r.chip_waktu]}`} />
        <Kotak judul="" isi={t.kesulitan[r.kesulitan]} />
      </div>
      {r.perlu_h_minus_1 && <p className="rounded-xl bg-emas/60 px-4 py-2 text-sm">{d.hMinus1}</p>}

      <section className="flex items-center justify-between rounded-2xl bg-kartu p-4">
        <div>
          <h2 className="font-medium">{d.porsi}</h2>
          <p className="text-sm text-neutral-500">{d.porsiIsi}</p>
        </div>
        <StepperKecil nilai={r.porsi_dipilih} onChange={(v) => setSp({ porsi: String(v) }, { replace: true })} />
      </section>

      {r.deskripsi && <p className="text-neutral-700">{r.deskripsi}</p>}

      {r.alat.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-judul text-xl font-bold">{d.alat}</h2>
          <div className="flex flex-wrap gap-2">
            {r.alat.map((a) => (
              <span key={a.nama} className={`rounded-full border px-3 py-1 text-sm ${a.punya || a.catatan ? 'border-black/10 bg-kartu' : 'border-terakota/30 bg-kurang'}`}>
                {a.catatan ? d.alatCatatan(a.nama, a.catatan) : a.nama}
              </span>
            ))}
          </div>
        </section>
      )}

      <p className={`rounded-xl px-4 py-3 text-sm font-medium ${kurang.length ? 'bg-kurang text-terakota' : 'bg-siap text-sage-gelap'}`}>
        {kurang.length ? d.ringkasanKurang(kurang.length, kurang.map((b) => b.nama.toLowerCase()).join(', ')) : d.ringkasanSemua}
      </p>
      {r.ringkasan.ada_kurang_takaran && <p className="rounded-xl bg-emas/60 px-4 py-3 text-sm">{d.catatanPorsi}</p>}

      <section className="space-y-4">
        <h2 className="font-judul text-xl font-bold">{d.bahan}</h2>
        {kelompok.map(([peran, daftar]) => (
          <div key={peran} className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-500">{d.peran[peran]}</h3>
            <ul className="space-y-2">
              {daftar.map((b) => (
                <li key={b.ingredient_id} className="space-y-2 rounded-xl bg-kartu p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span><span className="font-medium">{b.nama}</span> <span className="text-neutral-500">{takaran(b.butuh, b.satuan)}</span></span>
                    <StatusBahan b={b} />
                  </div>
                  {b.status === 'tidak_ada' && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setMitra(true)} className="rounded-lg bg-sage-gelap px-3 py-1.5 text-sm text-white">{d.beliMitra}</button>
                      <Link to="/plus" className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-sm">
                        {d.tanyaChef}<span className="rounded-full bg-emas px-2 text-[10px] font-semibold">{t.kartu.plus}</span>
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-judul text-xl font-bold">{d.langkah}</h2>
        <ol className="space-y-3">
          {r.langkah.map((l) => (
            <li key={l.urutan} className="flex gap-3 rounded-xl bg-kartu p-3">
              {l.foto_url ? <img src={l.foto_url} alt="" loading="lazy" className="size-16 shrink-0 rounded-lg object-cover" /> : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sage-gelap text-sm text-white">{l.urutan}</span>
              )}
              <div className="min-w-0">
                <p className="text-xs text-neutral-500">{l.urutan}. {d.fase[l.fase]}{l.timer_menit ? ` · ⏱ ${t.kartu.mnt(l.timer_menit)}` : ''}</p>
                <p>{l.instruksi}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="sticky bottom-28 lg:bottom-4">
        <Link to={`/resep/${r.id}/masak?porsi=${r.porsi_dipilih}`} className="block rounded-xl bg-terakota py-3 text-center font-medium text-white shadow-lg">{d.mulai}</Link>
      </div>

      {mitra && <SheetTokoMitra bahan={kurang} onTutup={() => setMitra(false)} />}
    </article>
  )
}
