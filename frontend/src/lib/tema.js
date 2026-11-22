// Tampilan pilihan pengguna: tema (palet: "ivory" bawaan atau "adonan") dan mode ("terang", "gelap", "sistem").
// Nilai warnanya ada di index.css; di sini hanya memilih, mengingat, dan memasang atribut di <html>.
const KUNCI_TEMA = 'masakada.tema'
const KUNCI_MODE = 'masakada.mode'
const MODE = ['terang', 'gelap', 'sistem']
const BILAH = { ivory: { terang: '#F8F5F0', gelap: '#151012' }, adonan: { terang: '#FBF5E9', gelap: '#14130F' } } // theme-color browser

const baca = (kunci, sah, awal) => {
  try { const v = localStorage.getItem(kunci); return sah.includes(v) ? v : awal } catch { return awal }
}
const simpan = (kunci, nilai) => {
  try { localStorage.setItem(kunci, nilai) } catch { /* penyimpanan diblokir: tetap berlaku untuk sesi ini */ }
}
const gelapSistem = () => !!window.matchMedia?.('(prefers-color-scheme: dark)').matches

export const bacaTema = () => baca(KUNCI_TEMA, Object.keys(BILAH), 'ivory')
export const bacaMode = () => baca(KUNCI_MODE, MODE, 'terang')
// Mode yang benar-benar tampil ("sistem" diterjemahkan ke terang/gelap).
export const modeEfektif = (m = bacaMode()) => (m === 'sistem' ? (gelapSistem() ? 'gelap' : 'terang') : m)

function pasang() {
  const tema = bacaTema()
  const mode = modeEfektif()
  const root = document.documentElement
  if (tema === 'adonan') root.dataset.tema = 'adonan'
  else delete root.dataset.tema
  if (mode === 'gelap') root.dataset.mode = 'gelap'
  else delete root.dataset.mode
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BILAH[tema][mode])
}

export function aturTema(tema) {
  simpan(KUNCI_TEMA, tema)
  pasang()
}

export function aturMode(mode) {
  simpan(KUNCI_MODE, mode)
  pasang()
}

// Dipanggil sekali saat aplikasi mulai; ikut berubah bila pengaturan gelap/terang sistem berubah (mode "sistem").
export function terapkanTema() {
  pasang()
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => bacaMode() === 'sistem' && pasang())
}
