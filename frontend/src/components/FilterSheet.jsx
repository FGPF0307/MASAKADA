import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'
import { FILTER_AWAL, keParams, toggle } from '../lib/filter'
import { Tombol } from './Form'
import { Chip, Segmented, Sakelar, StepperKecil } from './Pilihan'

// Lembar filter: bawah di HP, modal tengah di laptop. Tombol menampilkan jumlah resep siap dengan pilihan sementara.
export default function FilterSheet({ awal, onTerapkan, onTutup }) {
  const { profil } = usePreferences()
  const [f, setF] = useState(awal)
  const [jumlah, setJumlah] = useState(null)
  const s = t.filter
  const ubah = (bagian) => setF((x) => ({ ...x, ...bagian }))

  useEffect(() => {
    const jeda = setTimeout(() => {
      api(`/resep/cocok?${keParams(f)}`).then((d) => setJumlah(d.siap.length)).catch(() => setJumlah(null))
    }, 200)
    return () => clearTimeout(jeda)
  }, [f])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center" onClick={onTutup}>
      <div
        role="dialog"
        aria-label={s.judul}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full space-y-5 overflow-y-auto rounded-t-3xl bg-kartu p-5 lg:max-w-md lg:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-judul text-xl font-bold">{s.judul}</h2>
          <button className="text-sm text-terakota" onClick={() => setF({ ...FILTER_AWAL, alat: f.alat })}>{s.atur}</button>
        </div>

        <section className="space-y-2">
          <h3 className="font-medium">{s.waktu}</h3>
          <p className="text-sm text-neutral-600">{s.waktuIsi}</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(t.waktu).map((k) => (
              <Chip key={k} aktif={f.waktu.includes(k)} onClick={() => ubah({ waktu: toggle(f.waktu, k) })}>
                {t.waktu[k]} {t.waktuRentang[k]}
              </Chip>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">{s.porsi}</h3>
          <StepperKecil nilai={f.porsi ?? profil.porsi_default} onChange={(v) => ubah({ porsi: v })} />
          <p className="text-sm text-neutral-600">{s.porsiIsi}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">{s.kesulitan}</h3>
          <p className="text-sm text-neutral-600">{s.kesulitanIsi(t.keahlian[profil.level_keahlian])}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(t.kesulitan).map(([k, label]) => (
              <Chip key={k} aktif={f.kesulitan.includes(k)} onClick={() => ubah({ kesulitan: toggle(f.kesulitan, k) })}>{label}</Chip>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">{s.urut}</h3>
          <Segmented nilai={f.urut} onChange={(v) => ubah({ urut: v })} opsi={Object.entries(t.urut)} />
        </section>

        <Sakelar label={s.alatLain} nilai={f.alatLain} onChange={(v) => ubah({ alatLain: v })} />

        <Tombol onClick={() => onTerapkan(f)}>{jumlah === null ? t.hasil.ubahFilter : s.tampilkan(jumlah)}</Tombol>
      </div>
    </div>
  )
}
