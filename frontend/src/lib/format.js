const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

export const angka = (n) => fmt.format(n)
// 300 → "300 g"; 1.5 → "1,5 butir"
export const takaran = (n, satuan) => `${angka(n)} ${satuan}`
// Terima "1,5" atau "1.5"; NaN bila bukan angka.
export const parseAngka = (s) => Number(String(s).trim().replace(',', '.'))
