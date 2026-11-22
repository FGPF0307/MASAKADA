import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Galat, Memuat } from '../components/Kondisi'
import TombolKembali from '../components/TombolKembali'
import { usePreferences } from '../context/PreferencesContext'
import { f } from '../copy/fitur'

// Chat Chef AI (spesifikasi 8.12 #46): gratis 3/minggu, Plus 30/minggu.
export default function ChefAI() {
  const { profil } = usePreferences()
  const [pesan, setPesan] = useState(null)
  const [kuota, setKuota] = useState(null)
  const [teks, setTeks] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')
  const [gagalMuat, setGagalMuat] = useState(null)
  const [mock, setMock] = useState(false)
  const ujung = useRef(null)
  const c = f.chef

  useEffect(() => {
    api('/chef-ai/riwayat').then((d) => { setPesan(d.pesan); setKuota(d.kuota) }).catch(setGagalMuat)
  }, [])
  useEffect(() => { ujung.current?.scrollIntoView?.({ behavior: 'smooth' }) }, [pesan, sibuk])

  const kirim = async (isi) => {
    const q = isi.trim()
    if (!q || sibuk) return
    setGalat('')
    setSibuk(true)
    setPesan((p) => [...p, { id: `u${Date.now()}`, peran: 'user', isi: q }])
    setTeks('')
    try {
      const d = await api('/chef-ai/chat', { method: 'POST', body: { pesan: q } })
      setPesan((p) => [...p, { id: `a${Date.now()}`, peran: 'assistant', isi: d.jawaban, kartu: d.kartu }])
      setKuota(d.kuota)
      setMock(d.mock)
    } catch (e) {
      setGalat(e.message)
      setPesan((p) => p.slice(0, -1)) // pertanyaan yang gagal tidak ditampilkan
      setTeks(q)
    }
    setSibuk(false)
  }

  if (gagalMuat) return <Galat apa="Chef AI" onCoba={() => location.reload()} />
  if (!pesan) return <Memuat pesan={c.berpikir} n={1} />
  const habis = kuota?.sisa === 0

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <header className="flex items-center gap-3">
        <TombolKembali ke="/profil" />
        <div className="min-w-0 flex-1">
          <h1 className="font-judul text-2xl font-bold">{c.judul}</h1>
          <p className="text-xs text-neutral-500">{c.sub}</p>
        </div>
        {kuota && <span className="shrink-0 rounded-full bg-emas px-3 py-1 text-xs font-semibold">{c.sisa(kuota.sisa, kuota.batas)}</span>}
      </header>

      <ul className="space-y-3" aria-live="polite">
        {pesan.length === 0 && <li className="rounded-2xl bg-kartu p-4 text-sm text-neutral-600">{c.kosong}</li>}
        {pesan.map((m) => (
          <li key={m.id} className={`max-w-[85%] space-y-2 rounded-2xl px-4 py-3 text-sm ${m.peran === 'user' ? 'ml-auto bg-sage-gelap text-white' : 'bg-kartu'}`}>
            <p className="whitespace-pre-wrap">{m.isi}</p>
            {m.kartu?.map((k) => (
              <Link key={k.id} to={`/resep/${k.id}`} className="flex items-center gap-2 rounded-xl bg-kartu p-2 text-neutral-800">
                {k.foto_url ? <img src={k.foto_url} alt="" className="size-12 rounded-lg object-cover" /> : <span className="size-12 rounded-lg bg-siap" aria-hidden />}
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{k.judul}</span><span className="text-xs text-neutral-500">{k.total} mnt · {c.lihatResep}</span></span>
              </Link>
            ))}
          </li>
        ))}
        {sibuk && <li className="w-fit rounded-2xl bg-kartu px-4 py-3 text-sm text-neutral-500">{c.berpikir}</li>}
        <li ref={ujung} aria-hidden />
      </ul>

      {pesan.length === 0 && !habis && (
        <div className="flex flex-wrap gap-2">
          {c.saran.map((s) => <button key={s} onClick={() => kirim(s)} className="rounded-full border border-teks/10 bg-kartu px-3 py-2 text-sm">{s}</button>)}
        </div>
      )}

      {mock && <p className="text-xs text-neutral-500">{c.demoMode}</p>}
      {galat && <p role="alert" className="rounded-xl bg-kurang px-4 py-3 text-sm text-terakota">{galat}</p>}
      {habis && (
        <p className="rounded-xl bg-emas/50 px-4 py-3 text-sm">
          {c.habis} {profil.paket !== 'plus' && <Link to="/plus" className="font-medium underline">{c.habisGratis}</Link>}
        </p>
      )}

      <form onSubmit={(e) => { e.preventDefault(); kirim(teks) }} className="sticky bottom-28 flex gap-2 lg:bottom-4">
        <input value={teks} onChange={(e) => setTeks(e.target.value)} disabled={habis || sibuk} maxLength={500} placeholder={c.placeholder} aria-label={c.placeholder} className="min-w-0 flex-1 rounded-xl border border-teks/10 bg-kartu px-4 py-3 shadow outline-none focus:border-sage disabled:opacity-60" />
        <button disabled={habis || sibuk || !teks.trim()} className="rounded-xl bg-terakota px-5 font-medium text-white shadow disabled:opacity-60">{c.kirim}</button>
      </form>
      <p className="text-center text-xs text-neutral-400">{c.catatan}</p>
    </div>
  )
}
