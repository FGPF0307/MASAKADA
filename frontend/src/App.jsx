import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { t } from './copy/id'
import AturSandi from './pages/AturSandi'
import Daftar from './pages/Daftar'
import LupaSandi from './pages/LupaSandi'
import Masuk from './pages/Masuk'
import Onboarding, { KUNCI_ONBOARDING } from './pages/Onboarding'
import Profil from './pages/Profil'

// Halaman sementara; diganti per langkah di spesifikasi bagian 14.
const Halaman = ({ judul }) => (
  <>
    <h1 className="font-judul text-3xl font-bold">{judul}</h1>
    <p className="mt-2 text-neutral-500">{t.halaman.belumAda}</p>
  </>
)

const sudahOnboarding = () => {
  try { return !!localStorage.getItem(KUNCI_ONBOARDING) } catch { return true }
}

// Login wajib: tanpa sesi → onboarding (pertama kali) atau halaman masuk.
function Terproteksi() {
  const { session, memuat } = useAuth()
  if (memuat) return null
  return session ? <Outlet /> : <Navigate to={sudahOnboarding() ? '/masuk' : '/onboarding'} replace />
}

// Halaman akun hanya untuk tamu; yang sudah masuk diarahkan ke Beranda.
function Tamu() {
  const { session, memuat } = useAuth()
  if (memuat) return null
  return session ? <Navigate to="/" replace /> : <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Tamu />}>
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="masuk" element={<Masuk />} />
            <Route path="daftar" element={<Daftar />} />
            <Route path="lupa-sandi" element={<LupaSandi />} />
          </Route>
          <Route path="atur-sandi" element={<AturSandi />} />

          <Route element={<Terproteksi />}>
            <Route element={<Layout />}>
              <Route index element={<Halaman judul={t.halaman.beranda} />} />
              <Route path="pantry" element={<Halaman judul={t.halaman.pantry} />} />
              <Route path="pantry/tambah" element={<Halaman judul={t.halaman.tambahBahan} />} />
              <Route path="favorit" element={<Halaman judul={t.halaman.favorit} />} />
              <Route path="profil" element={<Profil />} />
              <Route path="bagikan/info" element={<Halaman judul={t.halaman.bagikan} />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
