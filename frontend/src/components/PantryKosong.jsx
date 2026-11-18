import { Link } from 'react-router-dom'
import { t } from '../copy/id'

// Kondisi pantry kosong (spesifikasi 8.13).
export default function PantryKosong() {
  const s = t.pantry
  return (
    <div className="mx-auto max-w-sm space-y-4 py-10 text-center">
      <h2 className="font-judul text-2xl font-bold">{s.kosongJudul}</h2>
      <p className="text-neutral-600">{s.kosongIsi}</p>
      <Link to="/pantry/tambah" className="block rounded-xl bg-terakota py-3 font-medium text-white">{s.tambahPertama}</Link>
      <Link to="/jelajahi" className="block text-sm text-sage-gelap">{s.jelajahi}</Link>
    </div>
  )
}
