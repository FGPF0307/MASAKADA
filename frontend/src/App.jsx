import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Pesan, Tombol } from './components/Form'
import Layout from './components/Layout'
import { ErrorBoundary } from './components/Kondisi'
import { UmpanProvider } from './components/Umpan'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PreferencesProvider, usePreferences } from './context/PreferencesContext'
import { t } from './copy/id'
import Admin from './pages/Admin'
import AturBahan from './pages/AturBahan'
import Bagikan from './pages/Bagikan'
import Pratinjau from './pages/bagikan/Pratinjau'
import StepBahan from './pages/bagikan/StepBahan'
import StepInfo from './pages/bagikan/StepInfo'
import StepLangkah from './pages/bagikan/StepLangkah'
import Terkirim from './pages/bagikan/Terkirim'
import DetailResepSaya from './pages/DetailResepSaya'
import Notifikasi from './pages/Notifikasi'
import Pencapaian from './pages/Pencapaian'
import RiwayatPoin from './pages/RiwayatPoin'
import ResepSaya from './pages/ResepSaya'
import Beranda from './pages/Beranda'
import Cari from './pages/Cari'
import DetailResep from './pages/DetailResep'
import HasilResep from './pages/HasilResep'
import Jelajahi from './pages/Jelajahi'
import AturSandi from './pages/AturSandi'
import Daftar from './pages/Daftar'
import LupaSandi from './pages/LupaSandi'
import MasakMode from './pages/MasakMode'
import Masuk from './pages/Masuk'
import Onboarding, { KUNCI_ONBOARDING } from './pages/Onboarding'
import Pantry from './pages/Pantry'
import Pengaturan from './pages/Pengaturan'
import Profil from './pages/Profil'
import Selesai from './pages/Selesai'
import SetupBahanPokok from './pages/SetupBahanPokok'
import SetupPantry from './pages/SetupPantry'
import SetupPreferensi from './pages/SetupPreferensi'
import TambahBahan from './pages/TambahBahan'
import Ulasan from './pages/Ulasan'
import ChefAI from './pages/ChefAI'
import Favorit from './pages/Favorit'
import Perencana from './pages/Perencana'
import Plus from './pages/Plus'
import Riwayat from './pages/Riwayat'
import Scan from './pages/Scan'
import TidakAda from './pages/TidakAda'
import Workshop from './pages/Workshop'
import WorkshopDaftar from './pages/WorkshopDaftar'
import WorkshopDetail from './pages/WorkshopDetail'
import WorkshopSaya from './pages/WorkshopSaya'

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

// Tanpa sesi: pertama kali → onboarding. Setelah itu tamu boleh melihat-lihat halaman di dalam Layout;
// isinya dikunci oleh GerbangTamu (Layout). Setup dan mode memasak tetap wajib login.
function Terproteksi() {
  const { session, memuat } = useAuth()
  const { pathname } = useLocation()
  if (memuat) return null
  if (!session) {
    if (!sudahOnboarding()) return <Navigate to="/onboarding" replace />
    if (pathname.startsWith('/setup') || /^\/resep\/[^/]+\/(masak|selesai)/.test(pathname)) return <Navigate to="/masuk" replace />
    return (
      <PreferencesProvider>
        <Outlet />
      </PreferencesProvider>
    )
  }
  return (
    <PreferencesProvider>
      <PerluSetup />
    </PreferencesProvider>
  )
}

// Halaman akun hanya untuk tamu; yang sudah masuk diarahkan ke Beranda.
// Kembali ke halaman yang tadi dituju (state.dari dari AjakMasuk).
function Tamu() {
  const { session, memuat } = useAuth()
  const { state } = useLocation()
  if (memuat) return null
  return session ? <Navigate to={state?.dari ?? '/'} replace /> : <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UmpanProvider>
        <ErrorBoundary>
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
            <Route path="resep/:id/masak" element={<MasakMode />} />
            <Route path="resep/:id/selesai" element={<Selesai />} />
            <Route element={<Layout />}>
              <Route index element={<Beranda />} />
              <Route path="resep/siap" element={<HasilResep />} />
              <Route path="cari" element={<Cari />} />
              <Route path="resep/:id" element={<DetailResep />} />
              <Route path="resep/:id/ulasan" element={<Ulasan />} />
              <Route path="plus" element={<Plus />} />
              <Route path="notifikasi" element={<Notifikasi />} />
              <Route path="pencapaian" element={<Pencapaian />} />
              <Route path="pencapaian/riwayat" element={<RiwayatPoin />} />
              <Route path="pantry" element={<Pantry />} />
              <Route path="pantry/tambah" element={<TambahBahan />} />
              <Route path="pantry/tambah/:ingredientId" element={<AturBahan />} />
              <Route path="pantry/:id" element={<AturBahan />} />
              <Route path="jelajahi" element={<Jelajahi />} />
              <Route path="favorit" element={<Favorit />} />
              <Route path="riwayat" element={<Riwayat />} />
              <Route path="chef-ai" element={<ChefAI />} />
              <Route path="scan" element={<Scan />} />
              <Route path="perencana" element={<Perencana />} />
              <Route path="workshop" element={<Workshop />} />
              <Route path="workshop/saya" element={<WorkshopSaya />} />
              <Route path="workshop/:id" element={<WorkshopDetail />} />
              <Route path="workshop/:id/daftar" element={<WorkshopDaftar />} />
              <Route path="profil" element={<Profil />} />
              <Route path="pengaturan" element={<Pengaturan />} />
              <Route path="bagikan/terkirim" element={<Terkirim />} />
              <Route path="bagikan" element={<Bagikan />}>
                <Route path="info" element={<StepInfo />} />
                <Route path="bahan" element={<StepBahan />} />
                <Route path="langkah" element={<StepLangkah />} />
                <Route path="pratinjau" element={<Pratinjau />} />
              </Route>
              <Route path="resep-saya" element={<ResepSaya />} />
              <Route path="resep-saya/:id" element={<DetailResepSaya />} />
              <Route path="admin" element={<Admin />} />
            </Route>
          </Route>
          <Route path="*" element={<TidakAda />} />
        </Routes>
        </ErrorBoundary>
        </UmpanProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
