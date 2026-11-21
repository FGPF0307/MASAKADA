import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import FotoResep from '../components/FotoResep'
import { IkonBagikan, IkonBintang, IkonHati } from '../components/Ikon'
import { Pesan } from '../components/Form'
import KartuUlasan from '../components/KartuUlasan'
import LaporSheet from '../components/LaporSheet'
import { StepperKecil } from '../components/Pilihan'
import SheetKoleksi from '../components/SheetKoleksi'
import SheetSubstitusi from '../components/SheetSubstitusi'
import SheetTokoMitra from '../components/SheetTokoMitra'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'
import { useUmpan } from '../components/Umpan'
import { f } from '../copy/fitur'
import { u } from '../copy/prinsip'
import { angka, takaran } from '../lib/format'

const Kotak = ({ judul, isi }) => (
  <div className="flex flex-1 flex-col justify-between gap-1 rounded-2xl bg-kartu p-3 text-center shadow-[0_1px_6px_rgba(59,42,30,0.07)]">
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
  const [ulasan, setUlasan] = useState(null)
  const [lapor, setLapor] = useState(null) // {recipe_id} atau {comment_id}
  const [koleksi, setKoleksi] = useState(false)
  const [subs, setSubs] = useState(null) // bahan yang kurang: {id, nama, satuan, butuh}
  const [info, setInfo] = useState('')
  const go = useNavigate()
  const { tampil } = useUmpan()
  const d = t.detail
  const porsi = sp.get('porsi')

  // Data lama tetap tampil saat memuat ulang karena porsi berubah.
  useEffect(() => {
    api(`/resep/${id}${porsi ? `?porsi=${porsi}` : ''}`).then(setR).catch((e) => setGalat(e.message))
  }, [id, porsi])

  useEffect(() => {
    api(`/resep/${id}/ulasan?batas=2`).then(setUlasan).catch(() => {}) // ringkasan saja; galat tidak menghalangi halaman
  }, [id])

  if (galat && !r) return <div className="max-w-md space-y-3"><Pesan>{galat}</Pesan><Link to="/" className="text-sm text-sage-gelap">{d.kembali}</Link></div>
  if (!r) return <p className="text-neutral-500">{t.halaman.memuat}</p>

  const kurang = r.ringkasan.bahan_kurang
  const kelompok = ['utama', 'opsional', 'bumbu_dasar'].map((p) => [p, r.bahan.filter((b) => b.peran === p)]).filter(([, l]) => l.length)

  const setFavorit = (favorit) => setR((x) => ({ ...x, favorit }))
  const ubahFavorit = async () => {
    setInfo('')
    try {
      if (r.favorit) {
        await api(`/favorit/${r.id}`, { method: 'DELETE' })
        tampil(u.favoritHapus, { urungkan: () => api('/favorit', { method: 'POST', body: { recipe_id: r.id } }).then(() => setFavorit(true)).catch((e) => tampil(e.message)) })
      } else {
        await api('/favorit', { method: 'POST', body: { recipe_id: r.id } })
        tampil(u.favoritTambah)
      }
      setFavorit(!r.favorit)
    } catch (e) { setInfo(e.message) }
  }
  // Tautan resep: lembar bagikan bawaan HP bila ada, kalau tidak disalin ke papan klip.
  const bagikan = async () => {
    const data = { title: r.judul, url: location.href }
    try {
      if (navigator.share) await navigator.share(data)
      else { await navigator.clipboard.writeText(data.url); setInfo(f.tautanDisalin) }
    } catch { /* dibatalkan pengguna */ }
  }

  return (
    <article className="mx-auto max-w-2xl space-y-5 pb-4">
      <div className="relative -mx-4 -mt-5 overflow-hidden rounded-b-[2rem] lg:mx-0 lg:mt-0 lg:rounded-3xl">
        <FotoResep resep={r} className="aspect-[4/3] lg:aspect-[16/9]" />
        <TombolKembali className="absolute left-4 top-4 bg-white/90" />
        <div className="absolute right-4 top-4 flex gap-2">
          <button onClick={bagikan} aria-label={f.favorit.bagikan} className="flex size-10 items-center justify-center rounded-full bg-kartu/95 text-waktu shadow-sm transition active:scale-90"><IkonBagikan className="size-5" /></button>
          <button onClick={ubahFavorit} aria-pressed={!!r.favorit} aria-label={r.favorit ? f.favorit.hapusFavorit : f.favorit.favoritkan} className={`flex size-10 items-center justify-center rounded-full bg-kartu/95 shadow-sm transition active:scale-90 ${r.favorit ? 'text-terakota' : 'text-waktu'}`}><IkonHati terisi={!!r.favorit} className="size-5" /></button>
        </div>
        {r.eksklusif && <span className="absolute bottom-3 left-4 rounded-full bg-emas px-3 py-1 text-xs font-semibold">{t.kartu.plus}</span>}
      </div>

      <header className="space-y-1">
        <h1 className="font-judul text-3xl font-bold leading-tight lg:text-4xl">{r.judul}</h1>
        <p className="text-neutral-600">{d.oleh(r.penulis, r.penulis_level)}</p>
        <p className="text-sm text-neutral-600">
          {r.jumlah_ulasan > 0 && <><span className="inline-flex items-center gap-1"><IkonBintang className="size-4 text-terakota" />{angka(r.rating_rata)} ({r.jumlah_ulasan})</span>{' · '}</>}
          {d.dicoba(r.dicoba_orang)}
        </p>
        <button onClick={() => setKoleksi(true)} className="pt-1 text-sm text-sage-gelap underline">{f.favorit.simpanKe}</button>
        {info && <p role="status" className="pt-1 text-sm text-neutral-600">{info}</p>}
      </header>

      <div className="flex gap-2">
        <Kotak judul={d.persiapan} isi={t.kartu.mnt(r.menit_persiapan)} />
        <Kotak judul={d.memasak} isi={t.kartu.mnt(r.menit_memasak)} />
        <Kotak judul={`${d.total} · ${t.waktu[r.chip_waktu]}`} isi={t.kartu.mnt(r.total)} />
        <Kotak judul={f.detail.kesulitan} isi={t.kesulitan[r.kesulitan]} />
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

      {r.nutrisi ? (
        <section className="space-y-1 rounded-2xl bg-kartu p-4">
          <h2 className="font-medium">{f.nutrisi.judul}</h2>
          <p className="font-judul text-2xl font-bold">{f.nutrisi.perPorsi(angka(r.nutrisi.kalori_per_porsi))}</p>
          <p className="text-xs text-neutral-500">{f.nutrisi.total(angka(r.nutrisi.kalori_total))} · {f.nutrisi.catatan}</p>
        </section>
      ) : (
        <Link to="/plus" className="block rounded-2xl bg-kartu p-4 text-sm text-neutral-600">
          <span className="mr-2 rounded-full bg-emas px-2 py-0.5 text-[10px] font-semibold">{t.kartu.plus}</span>{f.nutrisi.kunci}
        </Link>
      )}

      <section className="space-y-4">
        <h2 className="font-judul text-xl font-bold">{d.bahan}</h2>
        {kelompok.map(([peran, daftar]) => (
          <div key={peran} className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-500">{d.peran[peran]}</h3>
            <ul className="space-y-2">
              {daftar.map((b) => (
                <li key={b.ingredient_id} className="space-y-2 rounded-2xl bg-kartu p-4 shadow-[0_1px_6px_rgba(59,42,30,0.06)]">
                  <div className="flex items-center justify-between gap-3">
                    <span><span className="font-medium">{b.nama}</span> <span className="text-neutral-500">{takaran(b.butuh, b.satuan)}</span></span>
                    <StatusBahan b={b} />
                  </div>
                  {b.status === 'tidak_ada' && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setMitra(true)} className="rounded-lg bg-sage-gelap px-3 py-1.5 text-sm text-white">{d.beliMitra}</button>
                      <button onClick={() => (r.plus ? setSubs({ id: b.ingredient_id, nama: b.nama, satuan: b.satuan, butuh: b.butuh }) : go('/plus'))} className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-sm">
                        {d.tanyaChef}<span className="rounded-full bg-emas px-2 text-[10px] font-semibold">{t.kartu.plus}</span>
                      </button>
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
        {r.terkunci && <p className="rounded-xl bg-emas/60 px-4 py-3 text-sm">{f.eksklusif.kunci}</p>}
        <ol className="space-y-3">
          {r.langkah.map((l) => (
            <li key={l.urutan} className="flex gap-4 rounded-2xl bg-kartu p-4 shadow-[0_1px_6px_rgba(59,42,30,0.06)]">
              {l.foto_url ? <img src={l.foto_url} alt="" loading="lazy" className="size-20 shrink-0 rounded-xl object-cover" /> : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-gelap font-judul text-sm font-semibold text-white">{l.urutan}</span>
              )}
              <div className="min-w-0">
                <p className="text-xs text-neutral-500">{l.urutan}. {d.fase[l.fase]}{l.timer_menit ? ` · ⏱ ${t.kartu.mnt(l.timer_menit)}` : ''}</p>
                <p>{l.instruksi}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-judul text-xl font-bold">{t.ulasan.judul}</h2>
          <Link to={`/resep/${r.id}/ulasan`} className="text-sm text-sage-gelap">{t.ulasan.lihatSemua}</Link>
        </div>
        {ulasan && (ulasan.ulasan.length ? (
          <ul className="space-y-3">{ulasan.ulasan.map((u) => <KartuUlasan key={u.id} u={u} onLapor={(cid) => setLapor({ comment_id: cid })} />)}</ul>
        ) : (
          <p className="text-neutral-500">{t.ulasan.kosong}</p>
        ))}
        <button onClick={() => setLapor({ recipe_id: r.id })} className="text-sm text-neutral-500 underline">{t.ulasan.laporkanResep}</button>
      </section>

      <div className="sticky bottom-28 lg:bottom-4">
        {r.terkunci
          ? <Link to="/plus" className="block rounded-full bg-sage-gelap py-3.5 text-center font-semibold text-white shadow-[0_8px_20px_rgba(78,115,71,0.28)] transition active:scale-[0.98]">{f.eksklusif.buka}</Link>
          : <Link to={`/resep/${r.id}/masak?porsi=${r.porsi_dipilih}`} className="block rounded-full bg-terakota py-3.5 text-center font-semibold text-white shadow-[0_8px_20px_rgba(185,85,58,0.3)] transition active:scale-[0.98]">{d.mulai}</Link>}
      </div>

      {mitra && <SheetTokoMitra bahan={kurang} onTutup={() => setMitra(false)} />}
      {koleksi && <SheetKoleksi recipeId={r.id} onTutup={() => setKoleksi(false)} onSimpan={() => setFavorit(true)} />}
      {subs && (
        <SheetSubstitusi
          resepId={r.id} bahan={subs} porsi={r.porsi_dipilih} onTutup={() => setSubs(null)}
          onMasak={() => go(`/resep/${r.id}/masak?porsi=${r.porsi_dipilih}`)}
          onBeli={() => { setSubs(null); setMitra(true) }}
        />
      )}
      {lapor && <LaporSheet target={lapor} onTutup={() => setLapor(null)} />}
    </article>
  )
}
