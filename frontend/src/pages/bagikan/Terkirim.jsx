import { Link, useLocation } from 'react-router-dom'
import { IkonCentang } from '../../components/Ikon'
import { t } from '../../copy/id'

export default function Terkirim() {
  const { state } = useLocation()
  const k = t.bagikan.terkirim
  return (
    <div className="mx-auto max-w-md space-y-5 py-10 text-center">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-siap text-sage-gelap" aria-hidden><IkonCentang className="size-10" /></div>
      <h1 className="font-judul text-3xl font-bold">{k.judul}</h1>
      <p className="text-neutral-600">{k.isi(state?.judul || t.resepSaya.tanpaJudul)}</p>
      <p className="rounded-2xl bg-kartu px-4 py-3 text-sm">{k.poin}</p>
      <div className="space-y-3">
        <Link to="/" className="block rounded-xl bg-terakota py-3 font-medium text-white">{k.beranda}</Link>
        <Link to="/resep-saya" className="block rounded-xl border border-black/10 bg-kartu py-3">{k.resepSaya}</Link>
      </div>
    </div>
  )
}
