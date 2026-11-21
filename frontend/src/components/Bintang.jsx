import { t } from '../copy/id'

const Ikon = ({ penuh, className }) => (
  <svg viewBox="0 0 24 24" className={className} fill={penuh ? '#f5a623' : 'none'} stroke="#f5a623" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  </svg>
)

// Bintang untuk ditampilkan (1–5).
export const BintangTampil = ({ n, className = 'size-4' }) => (
  <span className="inline-flex" role="img" aria-label={t.nilai.bintang(n)}>
    {[1, 2, 3, 4, 5].map((i) => <Ikon key={i} penuh={i <= n} className={className} />)}
  </span>
)

// Pilihan bintang 1–5 dengan label di bawahnya (Kurang … Suka banget!).
export function BintangPilih({ nilai, onChange }) {
  return (
    <div className="space-y-1 text-center">
      <div role="radiogroup" aria-label={t.nilai.judul} className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={nilai === i} aria-label={t.nilai.bintang(i)} onClick={() => onChange(i)} className="p-1 active:scale-90">
            <Ikon penuh={i <= nilai} className="size-10" />
          </button>
        ))}
      </div>
      <p className="h-5 text-sm font-medium text-neutral-600">{nilai ? t.nilai.label[nilai - 1] : ''}</p>
    </div>
  )
}
