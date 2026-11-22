import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Galat, Memuat } from '../components/Kondisi'
import { Pesan, Tombol } from '../components/Form'
import TombolKembali from '../components/TombolKembali'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { f } from '../copy/fitur'

// Perencana menu mingguan (Plus). Disusun dari pantry; bisa dibuat ulang (kuota 3 per minggu) dan tiap menu bisa diganti.
export default function Perencana() {
  const { profil } = usePreferences()
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [resep, setResep] = useState(null) // daftar untuk "Ganti", dimuat saat dibutuhkan
  const [kurang, setKurang] = useState(false)
  const p = f.perencana
  const plus = profil.paket === 'plus'

  useEffect(() => { if (plus) api('/perencana').then(setD).catch(setGalat) }, [plus])

  const buat = async () => {
    setSibuk(true)
    setPesan('')
    try { setD(await api('/perencana/buat-ulang', { method: 'POST' })) } catch (e) { setPesan(e.message) }
    setSibuk(false)
  }
  const ganti = async (s, recipeId) => {
    if (!recipeId) return
    setPesan('')
    try { setD(await api('/perencana/slot', { method: 'PUT', body: { hari: s.hari, waktu_makan: s.waktu_makan, recipe_id: recipeId } })) } catch (e) { setPesan(e.message) }
  }
  const muatResep = () => { if (!resep) api('/resep/jelajahi').then((x) => setResep(x.sort((a, b) => a.judul.localeCompare(b.judul)))).catch(() => {}) }

  if (!plus)
    return (
      <div className="mx-auto max-w-md space-y-4">
        <TombolKembali ke="/profil" />
        <h1 className="font-judul text-3xl font-bold">{p.judul}</h1>
        <p className="rounded-2xl bg-emas/50 p-4">{p.khusus}</p>
        <Link to="/plus" className="block rounded-xl bg-terakota py-3 text-center font-medium text-white">{f.plus.lihat}</Link>
      </div>
    )
  if (galat && !d) return <Galat apa="perencana menu" onCoba={() => { setGalat(null); api('/perencana').then(setD).catch(setGalat) }} />
  if (!d) return <Memuat n={2} />

  const hari = (n) => d.slot.filter((s) => s.hari === n)
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/profil" />
        <div className="min-w-0 flex-1">
          <h1 className="font-judul text-3xl font-bold">{p.judul}</h1>
          <p className="text-sm text-neutral-500">{p.sub}</p>
        </div>
      </div>
      <Pesan>{pesan}</Pesan>

      {!d.ada ? (
        <div className="space-y-3 rounded-2xl bg-kartu p-5 text-center">
          <p className="text-neutral-600">{p.kosong}</p>
          <Tombol disabled={sibuk} onClick={buat}>{p.buat}</Tombol>
        </div>
      ) : (
        <>
          <section className="space-y-1 rounded-2xl bg-sage-gelap p-4 text-white">
            <p className="font-medium">{p.memakai(d.bahan_dipakai)}</p>
            {d.bahan_kurang.length > 0 && (
              <>
                <button onClick={() => setKurang((v) => !v)} className="text-sm underline" aria-expanded={kurang}>{p.kurang(d.bahan_kurang.length)}</button>
                {kurang && <p className="text-sm text-white/85">{d.bahan_kurang.join(', ')}</p>}
              </>
            )}
          </section>

          {p.hari.map((nama, i) => (
            <section key={nama} className="space-y-2">
              <h2 className="font-judul text-lg font-bold">{nama}</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {hari(i + 1).map((s) => (
                  <li key={s.waktu_makan} className="space-y-2 rounded-2xl bg-kartu p-3">
                    <p className="text-xs text-neutral-500">{p.waktu[s.waktu_makan]}</p>
                    {s.resep ? (
                      <Link to={`/resep/${s.resep.id}`} className="flex items-center gap-2">
                        {s.resep.foto_url ? <img src={s.resep.foto_url} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg object-cover" /> : <span className="size-12 shrink-0 rounded-lg bg-siap" aria-hidden />}
                        <span className="min-w-0"><span className="block truncate font-medium">{s.resep.judul}</span>
                          {s.resep.jumlah_kurang === 0 ? <span className="text-xs text-sage-gelap">{t.kartu.siap}</span> : <span className="text-xs text-terakota">{t.kartu.kurangN(s.resep.jumlah_kurang)}</span>}
                        </span>
                      </Link>
                    ) : <p className="text-sm text-neutral-400">—</p>}
                    <select aria-label={`${p.ganti} ${nama} ${p.waktu[s.waktu_makan]}`} value="" onFocus={muatResep} onChange={(e) => ganti(s, e.target.value)} className="w-full rounded-lg border border-teks/10 bg-kartu px-2 py-1.5 text-sm">
                      <option value="">{p.ganti}…</option>
                      {resep?.map((r) => <option key={r.id} value={r.id}>{r.judul}</option>)}
                    </select>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className="space-y-2">
            <Tombol variant="garis" disabled={sibuk || d.kuota.sisa === 0} onClick={buat}>{p.buatUlang}</Tombol>
            <p className="text-center text-xs text-neutral-500">{p.kuota(d.kuota.sisa, d.kuota.batas)}</p>
          </div>
          <p className="text-center text-xs text-neutral-400">{p.catatan}</p>
        </>
      )}
    </div>
  )
}
