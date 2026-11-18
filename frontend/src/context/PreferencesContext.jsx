import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

const PreferencesContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const usePreferences = () => useContext(PreferencesContext)

// Profil + preferensi pengguna yang sedang masuk (dipasang hanya saat ada sesi).
export function PreferencesProvider({ children }) {
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
  useEffect(() => { muat() }, [muat])

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

  return <PreferencesContext.Provider value={{ profil, galat, muat, perbarui }}>{children}</PreferencesContext.Provider>
}
