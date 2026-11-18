import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { simpanAlat } from '../api/saya'
import PilihAlat from '../components/PilihAlat'
import { Segmented } from '../components/Pilihan'
import SetupBingkai from '../components/SetupBingkai'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'

export default function SetupPreferensi() {
  const go = useNavigate()
  const { profil, perbarui } = usePreferences()
  const [alat, setAlat] = useState([])
  const [keahlian, setKeahlian] = useState(profil.level_keahlian)
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const s = t.setup.preferensi

  const lanjut = async () => {
    setSibuk(true)
    setGalat('')
    try {
      await simpanAlat(alat)
      await perbarui({ level_keahlian: keahlian })
      go('/setup/bahan-pokok')
    } catch (e) {
      setGalat(e.message)
      setSibuk(false)
    }
  }

  return (
    <SetupBingkai kembali="/setup/pantry" n={2} judul={s.judul} tombol={t.setup.lanjut} onLanjut={lanjut} sibuk={sibuk} galat={galat}>
      <section className="space-y-2">
        <h2 className="font-medium">{s.alat}</h2>
        <p className="text-sm text-neutral-600">{s.alatIsi}</p>
        <PilihAlat onChange={setAlat} />
        <p className="rounded-xl bg-siap px-4 py-3 text-sm text-sage-gelap">{s.alatInfo}</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-medium">{s.keahlian}</h2>
        <p className="text-sm text-neutral-600">{s.keahlianIsi}</p>
        <Segmented nilai={keahlian} onChange={setKeahlian} opsi={Object.entries(t.keahlian)} />
      </section>
    </SetupBingkai>
  )
}
