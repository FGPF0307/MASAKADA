import TombolKembali from '../components/TombolKembali'
import { prinsip } from '../copy/prinsip'

// Pemetaan 8 Golden Rules Shneiderman ke fitur nyata di MasakAda.
export default function Prinsip() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <TombolKembali ke="/pengaturan" />
        <h1 className="font-judul text-3xl font-bold">{prinsip.judul}</h1>
      </div>
      <p className="text-neutral-600">{prinsip.sub}</p>
      <ol className="space-y-4">
        {prinsip.aturan.map((a, i) => (
          <li key={a.nama} className="space-y-2 rounded-2xl bg-kartu p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-gelap font-judul text-lg font-bold text-white" aria-hidden>{i + 1}</span>
              <div>
                <h2 className="font-judul text-xl font-bold">{a.nama}</h2>
                <p className="text-xs text-neutral-500">{a.en}</p>
              </div>
            </div>
            <p className="text-neutral-700">{a.isi}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
              {a.wujud.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  )
}
