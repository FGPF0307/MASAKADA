import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

const PreferencesContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const usePreferences = () => useContext(PreferencesContext)

// Profil pengganti untuk tamu (belum login): tidak pernah dikirim ke server.
const PROFIL_TAMU = { tamu: true, nama: 'Tamu', paket: 'gratis', poin: 0, role: 'pengguna', setup_selesai: true, level_keahlian: 'pemula' }

// Profil + preferensi pengguna yang sedang masuk. Tanpa sesi, profil = PROFIL_TAMU.
export function PreferencesProvider({ children }) {
  const { session } = useAuth()
  const [profil, setProfil] = useState(null)
  const [galat, setGalat] = useState('')

  const muat = useCallback(async () => {
    setGalat('')
    try {
      setProfil(await api('/saya'))
    } catch (e) {
      setGalat(e.message)
    }
  }, [])
  useEffect(() => { if (session) muat() }, [session, muat])

  // Ubah di layar dulu, lalu simpan; jika gagal, muat ulang dari server.
  const perbarui = async (patch) => {
    setProfil((p) => ({ ...p, ...patch }))
    try {
      setProfil(await api('/saya', { method: 'PATCH', body: patch }))
    } catch (e) {
      setGalat(e.message)
      muat()
    }
  }

  const nilai = session ? { profil, galat, muat, perbarui } : { profil: PROFIL_TAMU, galat: '', muat, perbarui: async () => {} }
  return <PreferencesContext.Provider value={nilai}>{children}</PreferencesContext.Provider>
}
