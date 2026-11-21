import { t } from '../copy/id'
import { waktuLalu } from '../lib/format'
import { BintangTampil } from './Bintang'

// Satu komentar, beserta bintang penulisnya bila ada. onLapor(commentId) dipanggil dari tombol "Laporkan".
export default function KartuUlasan({ u, onLapor }) {
  return (
    <li className="space-y-2 rounded-2xl bg-kartu p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{u.milik_saya ? t.ulasan.kamu : u.nama}</p>
          <p className="text-xs text-neutral-500">{waktuLalu(u.dibuat_pada)}</p>
        </div>
        {u.bintang && <BintangTampil n={u.bintang} />}
      </div>
      {u.pakai_pengganti && <span className="inline-block rounded-full bg-emas px-3 py-0.5 text-xs">{t.ulasan.pakaiPengganti}</span>}
      <p className="whitespace-pre-line">{u.isi}</p>
      {u.foto_url && <img src={u.foto_url} alt="" loading="lazy" className="max-h-64 rounded-xl object-cover" />}
      {!u.milik_saya && onLapor && <button onClick={() => onLapor(u.id)} className="text-xs text-neutral-500 underline">{t.ulasan.laporkan}</button>}
    </li>
  )
}
