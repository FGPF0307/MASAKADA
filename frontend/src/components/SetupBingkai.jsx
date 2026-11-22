import { t } from '../copy/id'
import Logo from './Logo'
import TombolKembali from './TombolKembali'
import { Pesan, Tombol } from './Form'

// Bingkai tiga langkah setup: judul, isi, dan tombol aksi menempel di bawah layar.
export default function SetupBingkai({ n, judul, isi, tombol, onLanjut, sibuk, galat, kembali, children }) {
  return (
    <div className="min-h-screen max-w-xl mx-auto px-4 pt-6 pb-32">
      <div className="flex items-center gap-3">
        {kembali && <TombolKembali ke={kembali} />}
        <Logo />
      </div>
      <p className="mt-6 text-sm font-medium text-sage-gelap">{t.setup.langkah(n)}</p>
      <h1 className="mt-1 font-judul text-3xl font-bold">{judul}</h1>
      {isi && <p className="mt-2 text-neutral-600">{isi}</p>}
      <div className="mt-6 space-y-6">{children}</div>
      <div className="fixed bottom-0 inset-x-0 bg-krem/95 border-t border-teks/5 px-4 py-3">
        <div className="max-w-xl mx-auto space-y-2">
          <Pesan>{galat}</Pesan>
          <Tombol onClick={onLanjut} disabled={sibuk}>{tombol}</Tombol>
        </div>
      </div>
    </div>
  )
}
