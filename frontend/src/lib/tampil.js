// Format tampilan untuk fitur Plus/Workshop/Riwayat.
export const rupiah = (n) => (n === 0 ? 'Gratis' : `Rp${n.toLocaleString('id-ID')}`)

export const tglWib = (iso, panjang = true) =>
  `${new Date(iso).toLocaleString('id-ID', { weekday: panjang ? 'long' : undefined, day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB`

// Mengelompokkan menurut waktu: Hari ini / Minggu ini / Sebelumnya (kelompok kosong dibuang).
export function kelompokWaktu(daftar, kunci) {
  const awalHari = new Date().setHours(0, 0, 0, 0)
  const mingguLalu = awalHari - 6 * 86400000
  const k = { hariIni: [], mingguIni: [], sebelumnya: [] }
  for (const x of daftar) {
    const w = new Date(x[kunci]).getTime()
    ;(w >= awalHari ? k.hariIni : w >= mingguLalu ? k.mingguIni : k.sebelumnya).push(x)
  }
  return [['hariIni', k.hariIni], ['mingguIni', k.mingguIni], ['sebelumnya', k.sebelumnya]].filter(([, l]) => l.length)
}
