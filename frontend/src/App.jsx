import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Pesan, Tombol } from './components/Form'
import Layout from './components/Layout'
import TombolKembali from './components/TombolKembali'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PreferencesProvider, usePreferences } from './context/PreferencesContext'
import { t } from './copy/id'
import AturBahan from './pages/AturBahan'
import Beranda from './pages/Beranda'
import Cari from './pages/Cari'
import DetailResep from './pages/DetailResep'
import HasilResep from './pages/HasilResep'
import Jelajahi from './pages/Jelajahi'
import AturSandi from './pages/AturSandi'
import Daftar from './pages/Daftar'
import LupaSandi from './pages/LupaSandi'
import Masuk from './pages/Masuk'
import Onboarding, { KUNCI_ONBOARDING } from './pages/Onboarding'
import Pantry from './pages/Pantry'
import Pengaturan from './pages/Pengaturan'
import Profil from './pages/Profil'
import SetupBahanPokok from './pages/SetupBahanPokok'
import SetupPantry from './pages/SetupPantry'
import SetupPreferensi from './pages/SetupPreferensi'
import TambahBahan from './pages/TambahBahan'

// Halaman sementara; diganti per langkah di spesifikasi bagian 14.
const Halaman = ({ judul }) => (
  <div className="space-y-3">
    <TombolKembali />
    <h1 className="font-judul text-3xl font-bold">{judul}</h1>
    <p className="text-neutral-500">{t.halaman.belumAda}</p>
  </div>
)

const sudahOnboarding = () => {
  try { return !!localStorage.getItem(KUNCI_ONBOARDING) } catch { return true }
}

// Pengguna yang belum menyelesaikan setup 3 langkah diarahkan ke setup; yang sudah, tidak bisa kembali ke setup.
function PerluSetup() {
  const { profil, galat, muat } = usePreferences()
  const { pathname } = useLocation()
  if (!profil)
    return galat ? (
      <div className="mx-auto max-w-sm space-y-3 p-6">
        <Pesan>{galat}</Pesan>
        <Tombol onClick={muat}>{t.galat.coba}</Tombol>
      </div>
    ) : null
  const diSetup = pathname.startsWith('/setup')
  if (!profil.setup_selesai && !diSetup) return <Navigate to="/setup/pantry" replace />
  if (profil.setup_selesai && diSetup) return <Navigate to="/" replace />
  return <Outlet />
}

// Login wajib: tanpa sesi → onboarding (pertama kali) atau halaman masuk.
function Terproteksi() {
  const { session, memuat } = useAuth()
  if (memuat) return null
  if (!session) return <Navigate to={sudahOnboarding() ? '/masuk' : '/onboarding'} replace />
  return (
    <PreferencesProvider>
      <PerluSetup />
    </PreferencesProvider>
  )
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
            <Route path="setup/pantry" element={<SetupPantry />} />
            <Route path="setup/preferensi" element={<SetupPreferensi />} />
            <Route path="setup/bahan-pokok" element={<SetupBahanPokok />} />
            <Route element={<Layout />}>
              <Route index element={<Beranda />} />
              <Route path="resep/siap" element={<HasilResep />} />
              <Route path="cari" element={<Cari />} />
              <Route path="resep/:id" element={<DetailResep />} />
              <Route path="resep/:id/masak" element={<Halaman judul="Mode memasak" />} />
              <Route path="plus" element={<Halaman judul="MasakAda Plus" />} />
              <Route path="notifikasi" element={<Halaman judul="Notifikasi" />} />
              <Route path="pantry" element={<Pantry />} />
              <Route path="pantry/tambah" element={<TambahBahan />} />
              <Route path="pantry/tambah/:ingredientId" element={<AturBahan />} />
              <Route path="pantry/:id" element={<AturBahan />} />
              <Route path="jelajahi" element={<Jelajahi />} />
              <Route path="favorit" element={<Halaman judul={t.halaman.favorit} />} />
              <Route path="profil" element={<Profil />} />
              <Route path="pengaturan" element={<Pengaturan />} />
              <Route path="bagikan/info" element={<Halaman judul={t.halaman.bagikan} />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
