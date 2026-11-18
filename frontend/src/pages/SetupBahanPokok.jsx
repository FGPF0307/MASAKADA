import { useState } from 'react'
import { selesaikanSetup, simpanBahanPokok } from '../api/saya'
import PilihBahanPokok from '../components/PilihBahanPokok'
import SetupBingkai from '../components/SetupBingkai'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../copy/id'

export default function SetupBahanPokok() {
  const { muat } = usePreferences()
  const [daftar, setDaftar] = useState([])
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const s = t.setup.pokok

  const selesai = async () => {
    setSibuk(true)
    setGalat('')
    try {
      await simpanBahanPokok(daftar)
      await selesaikanSetup()
      await muat() // setup_selesai = true → gerbang mengarahkan ke Beranda
    } catch (e) {
      setGalat(e.message)
      setSibuk(false)
    }
  }

  return (
    <SetupBingkai kembali="/setup/preferensi" n={3} judul={s.judul} isi={s.isi} tombol={t.setup.selesai} onLanjut={selesai} sibuk={sibuk} galat={galat}>
      <PilihBahanPokok onChange={setDaftar} />
    </SetupBingkai>
  )
}
