import { useEffect } from 'react'

// Lembar dari bawah (HP) / dialog di tengah (laptop). Esc atau ketuk latar menutupnya.
export default function Sheet({ judul, onTutup, children }) {
  useEffect(() => {
    const tombol = (e) => e.key === 'Escape' && onTutup()
    window.addEventListener('keydown', tombol)
    return () => window.removeEventListener('keydown', tombol)
  }, [onTutup])
  return (
    <div className="animate-pudar fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center" onClick={onTutup}>
      <div role="dialog" aria-label={judul} onClick={(e) => e.stopPropagation()} className="animate-geser-naik max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-t-3xl bg-kartu p-5 lg:max-w-md lg:rounded-2xl">
        {children}
      </div>
    </div>
  )
}
