import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { u } from '../copy/prinsip'
import Sheet from './Sheet'

const Ctx = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useUmpan = () => useContext(Ctx)

// Umpan balik seragam di seluruh aplikasi:
//   tampil(pesan, { urungkan })  → toast singkat, dengan tombol "Urungkan" bila aksinya bisa dibatalkan
//   tanya({ judul, isi, ya })    → dialog konfirmasi; mengembalikan Promise<boolean> (pilihan aman "Batal" terpilih lebih dulu)
export function UmpanProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [dialog, setDialog] = useState(null)
  const timer = useRef(0)

  const tampil = useCallback((pesan, { urungkan } = {}) => {
    clearTimeout(timer.current)
    setToast({ pesan, urungkan })
    timer.current = setTimeout(() => setToast(null), urungkan ? 7000 : 3500)
  }, [])
  const tanya = useCallback((opsi) => new Promise((selesai) => setDialog({ ...opsi, selesai })), [])
  const jawab = (ya) => {
    dialog.selesai(ya)
    setDialog(null)
  }

  return (
    <Ctx.Provider value={{ tampil, tanya }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-3 z-[70] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-neutral-800 px-4 py-3 text-sm text-white shadow-lg"
          style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }}
        >
          <span>{toast.pesan}</span>
          {toast.urungkan && (
            <button onClick={() => { toast.urungkan(); setToast(null) }} className="shrink-0 font-semibold text-emas underline">{u.urungkan}</button>
          )}
        </div>
      )}
      {dialog && (
        <Sheet judul={dialog.judul} onTutup={() => jawab(false)}>
          <h2 className="font-judul text-xl font-bold">{dialog.judul}</h2>
          {dialog.isi && <p className="text-neutral-600">{dialog.isi}</p>}
          <div className="flex gap-3">
            <button autoFocus onClick={() => jawab(false)} className="flex-1 rounded-xl border border-black/10 bg-white py-3 font-medium">{dialog.tetap ?? u.batal}</button>
            <button onClick={() => jawab(true)} className="flex-1 rounded-xl bg-terakota py-3 font-medium text-white">{dialog.ya ?? u.ya}</button>
          </div>
        </Sheet>
      )}
    </Ctx.Provider>
  )
}
