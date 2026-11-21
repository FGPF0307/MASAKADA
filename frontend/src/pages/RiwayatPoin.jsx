import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Pesan } from '../components/Form'
import TombolKembali from '../components/TombolKembali'
import { t } from '../copy/id'

const tanda = (n) => (n > 0 ? `+${n}` : String(n))

// Mengelompokkan menurut tanggal lokal: hari ini, 7 hari terakhir, sebelumnya.
function kelompokkan(daftar) {
  const mulaiHari = new Date(); mulaiHari.setHours(0, 0, 0, 0)
  const mingguLalu = mulaiHari.getTime() - 6 * 86400000
  const k = { hariIni: [], mingguIni: [], sebelumnya: [] }
  for (const x of daftar) {
    const w = new Date(x.dibuat_pada).getTime()
    ;(w >= mulaiHari.getTime() ? k.hariIni : w >= mingguLalu ? k.mingguIni : k.sebelumnya).push(x)
  }
  return k
}

export default function RiwayatPoin() {
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState('')
  const h = t.riwayatPoin

  useEffect(() => {
    api('/pencapaian/riwayat-poin').then(setD).catch((e) => setGalat(e.message))
  }, [])

  if (galat && !d) return <div className="max-w-md space-y-3"><TombolKembali ke="/pencapaian" /><Pesan>{galat}</Pesan></div>
  if (!d) return <p className="text-neutral-500">{t.halaman.memuat}</p>
  const k = kelompokkan(d.daftar)

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/pencapaian" />
        <h1 className="font-judul text-3xl font-bold">{h.judul}</h1>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-sage-gelap p-4 text-white"><p className="text-sm text-white/80">{h.bulanIni}</p><p className="font-judul text-3xl font-bold">{tanda(d.bulan_ini)}</p></div>
        <div className="rounded-2xl bg-kartu p-4"><p className="text-sm text-neutral-500">{h.sepanjangWaktu}</p><p className="font-judul text-3xl font-bold">{d.total}</p></div>
      </div>

      {d.daftar.length === 0 && <p className="py-6 text-center text-neutral-500">{h.kosong}</p>}
      {[['hariIni', h.hariIni], ['mingguIni', h.mingguIni], ['sebelumnya', h.sebelumnya]].map(([kunci, judul]) =>
        k[kunci].length ? (
          <section key={kunci} className="space-y-2">
            <h2 className="font-medium text-neutral-600">{judul}</h2>
            <ul className="space-y-2">
              {k[kunci].map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-3 rounded-xl bg-kartu px-4 py-3">
                  <span className="min-w-0"><span className="block">{h.aksi[x.aksi] ?? x.aksi}</span>{x.judul && <span className="block truncate text-sm text-neutral-500">{x.judul}</span>}</span>
                  <span className={`shrink-0 font-semibold ${x.poin < 0 ? 'text-terakota' : x.poin === 0 ? 'text-neutral-400' : 'text-sage-gelap'}`}>{tanda(x.poin)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
      <p className="text-xs text-neutral-500">{h.catatan}</p>
    </div>
  )
}
