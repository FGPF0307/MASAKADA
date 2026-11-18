// Filter hasil resep. Disimpan di URL (bisa dibagikan, tombol kembali berfungsi) dan dikirim ke API dengan nama yang sama.
export const FILTER_AWAL = { waktu: [], porsi: null, kesulitan: [], urut: 'bahan', alatLain: false, alat: null }

export function dariParams(sp) {
  const csv = (k) => (sp.get(k) ? sp.get(k).split(',') : [])
  return {
    waktu: csv('waktu'),
    kesulitan: csv('kesulitan'),
    porsi: sp.get('porsi') ? Number(sp.get('porsi')) : null,
    urut: sp.get('urut') ?? 'bahan',
    alatLain: sp.get('alatLain') === 'true',
    alat: sp.get('alat'),
  }
}

export function keParams(f) {
  const sp = new URLSearchParams()
  if (f.waktu.length) sp.set('waktu', f.waktu.join(','))
  if (f.kesulitan.length) sp.set('kesulitan', f.kesulitan.join(','))
  if (f.porsi) sp.set('porsi', String(f.porsi))
  if (f.urut !== 'bahan') sp.set('urut', f.urut)
  if (f.alatLain) sp.set('alatLain', 'true')
  if (f.alat) sp.set('alat', f.alat)
  return sp
}

// Chip filter aktif yang bisa dihapus satu per satu. label diisi pemanggil (butuh teks UI).
export function chipAktif(f, label) {
  return [
    ...f.waktu.map((w) => ({ kunci: `w-${w}`, teks: label.waktu(w), hapus: { ...f, waktu: f.waktu.filter((x) => x !== w) } })),
    ...f.kesulitan.map((k) => ({ kunci: `k-${k}`, teks: label.kesulitan(k), hapus: { ...f, kesulitan: f.kesulitan.filter((x) => x !== k) } })),
    ...(f.porsi ? [{ kunci: 'porsi', teks: label.porsi(f.porsi), hapus: { ...f, porsi: null } }] : []),
    ...(f.alat ? [{ kunci: 'alat', teks: f.alat, hapus: { ...f, alat: null } }] : []),
    ...(f.alatLain ? [{ kunci: 'alatLain', teks: label.alatLain, hapus: { ...f, alatLain: false } }] : []),
  ]
}

export const toggle = (daftar, nilai) => (daftar.includes(nilai) ? daftar.filter((x) => x !== nilai) : [...daftar, nilai])
