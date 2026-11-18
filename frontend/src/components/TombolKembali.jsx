import { useLocation, useNavigate } from 'react-router-dom'
import { t } from '../copy/id'

// Kembali ke halaman sebelumnya di dalam aplikasi; bila halaman dibuka langsung lewat URL, pergi ke `ke`.
// eslint-disable-next-line react-refresh/only-export-components
export function useKembali(ke = '/') {
  const go = useNavigate()
  const { key } = useLocation()
  return () => (key !== 'default' ? go(-1) : go(ke, { replace: true }))
}

export default function TombolKembali({ ke = '/', className = '' }) {
  const kembali = useKembali(ke)
  return (
    <button
      type="button"
      onClick={kembali}
      aria-label={t.detail.kembali}
      className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-kartu shadow-sm active:scale-95 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  )
}
