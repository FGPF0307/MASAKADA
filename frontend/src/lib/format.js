import { t } from '../copy/id'

const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

export const angka = (n) => fmt.format(n)
// 300 → "300 g"; 1.5 → "1,5 butir"
export const takaran = (n, satuan) => `${angka(n)} ${satuan}`
// Terima "1,5" atau "1.5"; NaN bila bukan angka.
export const parseAngka = (s) => Number(String(s).trim().replace(',', '.'))

// "2 hari lalu"; lebih dari seminggu menampilkan tanggal.
export function waktuLalu(iso) {
  const w = t.waktuLalu
  const menit = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (menit < 1) return w.baru
  if (menit < 60) return w.menit(menit)
  if (menit < 1440) return w.jam(Math.floor(menit / 60))
  if (menit < 10080) return w.hari(Math.floor(menit / 1440))
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
