import { Link } from 'react-router-dom'
import { f } from '../copy/fitur'

// Rute yang tidak dikenal.
export default function TidakAda() {
  const k = f.kondisi
  return (
    <div className="mx-auto max-w-sm space-y-3 px-4 py-16 text-center">
      <p className="font-judul text-6xl font-bold text-sage-gelap">404</p>
      <h1 className="font-judul text-2xl font-bold">{k.tidakAdaJudul}</h1>
      <p className="text-neutral-600">{k.tidakAdaIsi}</p>
      <Link to="/" className="block rounded-xl bg-terakota py-3 font-medium text-white">{k.kembali}</Link>
    </div>
  )
}
