import { Link } from 'react-router-dom'
import { f } from '../copy/fitur'

// Banner iklan tiruan untuk paket Gratis (spesifikasi P-11). Bukan iklan sungguhan.
export default function IklanTiruan() {
  const i = f.iklan
  return (
    <aside aria-label="Iklan" className="rounded-2xl border border-dashed border-black/15 bg-white p-4 text-center">
      <p className="text-[10px] uppercase tracking-wide text-neutral-400">{i.label}</p>
      <p className="font-medium">{i.judul}</p>
      <p className="text-sm text-neutral-500">{i.isi}</p>
      <Link to="/plus" className="mt-1 inline-block text-sm text-sage-gelap">{i.hilangkan}</Link>
    </aside>
  )
}
