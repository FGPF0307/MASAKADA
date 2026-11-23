import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { Pesan } from '../components/Form'
import TombolKembali from '../components/TombolKembali'
import { useUmpan } from '../components/Umpan'
import { t } from '../copy/id'
import { u } from '../copy/umpan'
import { takaran } from '../lib/format'

// Menjaga layar tetap menyala selama memasak (Wake Lock API); diminta ulang saat tab kembali terlihat.
function useLayarMenyala() {
  useEffect(() => {
    let kunci
    const minta = async () => {
      try { kunci = await navigator.wakeLock?.request('screen') } catch { /* tidak didukung / ditolak: abaikan */ }
    }
    const ulang = () => document.visibilityState === 'visible' && minta()
    minta()
    document.addEventListener('visibilitychange', ulang)
    return () => {
      document.removeEventListener('visibilitychange', ulang)
      kunci?.release?.().catch(() => {})
    }
  }, [])
}

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// Dihitung dari waktu akhir (bukan dikurangi tiap detik) supaya tetap akurat saat tab di latar belakang.
function Timer({ menit }) {
  const [sisa, setSisa] = useState(menit * 60)
  const [jalan, setJalan] = useState(false)
  const akhir = useRef(0)
  const m = t.masak

  useEffect(() => {
    if (!jalan) return
    const id = setInterval(() => {
      const s = Math.max(0, Math.ceil((akhir.current - Date.now()) / 1000))
      setSisa(s)
      if (s === 0) {
        setJalan(false)
        navigator.vibrate?.([300, 150, 300])
      }
    }, 250)
    return () => clearInterval(id)
  }, [jalan])

  const mulai = () => {
    akhir.current = Date.now() + sisa * 1000
    setJalan(true)
  }
  const habis = sisa === 0
  return (
    <div className={`flex items-center justify-between gap-3 rounded-3xl p-5 shadow-[0_2px_10px_rgba(27,20,22,0.08)] ${habis ? 'bg-terakota text-white' : 'bg-kartu'}`}>
      <p role="timer" aria-live="off" className="font-judul text-5xl font-bold tabular-nums">{habis ? m.waktuHabis : mmss(sisa)}</p>
      <div className="flex gap-2">
        {!habis && (
          <button onClick={jalan ? () => setJalan(false) : mulai} className="rounded-xl bg-sage-gelap px-4 py-2 text-white">{jalan ? m.jeda : m.mulai}</button>
        )}
        <button onClick={() => { setJalan(false); setSisa(menit * 60) }} className={`rounded-xl border px-4 py-2 ${habis ? 'border-white/60' : 'border-teks/10'}`}>{m.ulang}</button>
      </div>
    </div>
  )
}

export default function MasakMode() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const go = useNavigate()
  const [data, setData] = useState(null)
  const [galat, setGalat] = useState('')
  const [i, setI] = useState(0)
  const m = t.masak
  const porsi = sp.get('porsi')
  useLayarMenyala()
  const { tanya } = useUmpan()

  // Pintasan untuk pengguna mahir: panah kiri/kanan memindah langkah.
  useEffect(() => {
    const tombol = (e) => {
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return
      if (e.key === 'ArrowRight') setI((n) => Math.min(n + 1, (data?.langkah.length ?? 1) - 1))
      if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1))
    }
    window.addEventListener('keydown', tombol)
    return () => window.removeEventListener('keydown', tombol)
  }, [data])

  useEffect(() => {
    api(`/resep/${id}/masak${porsi ? `?porsi=${porsi}` : ''}`).then(setData).catch((e) => setGalat(e.message))
  }, [id, porsi])

  if (galat) return <div className="mx-auto max-w-md space-y-3 p-4"><TombolKembali ke={`/resep/${id}`} /><Pesan>{galat}</Pesan></div>
  if (!data) return <p className="p-4 text-neutral-500">{t.halaman.memuat}</p>

  const total = data.langkah.length
  const l = data.langkah[i]
  const terakhir = i === total - 1
  const ke = (n) => { window.scrollTo({ top: 0 }); setI(n) }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-32 pt-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t.detail.kembali}
          onClick={async () => { if (i === 0 || (await tanya(u.keluarMasak))) go(`/resep/${id}`, { replace: true }) }}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-kartu shadow-sm active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <p className="min-w-0 flex-1 truncate text-sm text-neutral-600">{data.judul}</p>
      </header>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{m.langkah(i + 1, total)}</span>
          <span className="rounded-full bg-siap px-3 py-0.5 text-sage-gelap">{t.detail.fase[l.fase]}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-teks/10" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={i + 1}>
          <div className="h-full rounded-full bg-sage-gelap transition-all" style={{ width: `${((i + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {l.foto_url && <img src={l.foto_url} alt="" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_6px_20px_rgba(27,20,22,0.14)]" />}
        <p className="text-2xl font-medium leading-snug lg:text-3xl">{l.instruksi}</p>

        {l.bahan.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-neutral-500">{m.bahanLangkah}</h2>
            <div className="flex flex-wrap gap-2">
              {l.bahan.map((b) => <span key={b.nama} className="rounded-full bg-kartu px-3 py-1.5 text-sm">{b.nama} {takaran(b.butuh, b.satuan)}</span>)}
            </div>
          </section>
        )}
        {l.alat.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-neutral-500">{m.alat}</h2>
            <div className="flex flex-wrap gap-2">{l.alat.map((a) => <span key={a} className="rounded-full bg-kartu px-3 py-1.5 text-sm">{a}</span>)}</div>
          </section>
        )}
        {l.timer_menit > 0 && <Timer key={l.urutan} menit={l.timer_menit} />}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-teks/5 bg-krem/95 px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button
            onClick={() => ke(i - 1)}
            disabled={i === 0}
            aria-label={m.sebelumnya}
            className="flex size-14 shrink-0 items-center justify-center rounded-full border border-teks/10 bg-kartu transition active:scale-95 disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button
            onClick={() => (terakhir ? go(`/resep/${id}/selesai?porsi=${data.porsi_dipilih}`) : ke(i + 1))}
            className="h-14 flex-1 rounded-full bg-terakota text-lg font-semibold text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--color-terakota)_30%,transparent)] transition active:scale-[0.98]"
          >
            {terakhir ? m.selesai : m.berikutnya}
          </button>
        </div>
      </div>
    </div>
  )
}
