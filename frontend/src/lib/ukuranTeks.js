// Ukuran teks pilihan pengguna (usability universal). Semua ukuran Tailwind berbasis rem, jadi cukup skala akar.
const KUNCI = 'masakada.ukuranTeks'
const SKALA = { normal: '100%', besar: '112.5%', sangat: '125%' }

export const bacaUkuran = () => {
  try { return SKALA[localStorage.getItem(KUNCI)] ? localStorage.getItem(KUNCI) : 'normal' } catch { return 'normal' }
}

export function aturUkuran(k) {
  try { localStorage.setItem(KUNCI, k) } catch { /* penyimpanan diblokir: tetap berlaku untuk sesi ini */ }
  document.documentElement.style.fontSize = SKALA[k]
}

export const terapkanUkuran = () => aturUkuran(bacaUkuran())
