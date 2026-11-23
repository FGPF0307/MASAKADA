import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'
import { supabase } from '../lib/supabaseClient'
import { KUNCI_ONBOARDING } from '../pages/Onboarding'

const AuthContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [memuat, setMemuat] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setMemuat(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Setiap fungsi melempar error Supabase bila gagal.
  const cek = ({ error, data }) => {
    if (error) throw error
    return data
  }
  const aksi = {
    masuk: (email, password) => supabase.auth.signInWithPassword({ email, password }).then(cek),
    // Akun dibuat server (email langsung terverifikasi, tanpa email konfirmasi), lalu langsung masuk.
    daftar: async (nama, email, password) => {
      await api('/publik/daftar', { method: 'POST', body: { nama, email, sandi: password } })
      return supabase.auth.signInWithPassword({ email, password }).then(cek)
    },
    google: () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }).then(cek),
    lupaSandi: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/atur-sandi` }).then(cek),
    aturSandi: (password) => supabase.auth.updateUser({ password }).then(cek),
    // Keluar → kembali ke halaman pembuka (onboarding): tandanya dihapus dulu, lalu sesi diakhiri.
    keluar: () => {
      try { localStorage.removeItem(KUNCI_ONBOARDING) } catch { /* mode privat: abaikan */ }
      return supabase.auth.signOut().then(cek)
    },
  }

  return <AuthContext.Provider value={{ session, memuat, ...aksi }}>{children}</AuthContext.Provider>
}
