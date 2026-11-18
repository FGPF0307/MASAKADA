// Level kontributor dari poin (spesifikasi 9.2).
export const LEVEL = [
  { nomor: 1, nama: 'New Contributor', ambang: 0 },
  { nomor: 2, nama: 'Home Chef', ambang: 100 },
  { nomor: 3, nama: 'Pantry Hero', ambang: 300 },
  { nomor: 4, nama: 'Zero-Waste Master', ambang: 700 },
]

export const levelDari = (poin) => [...LEVEL].reverse().find((l) => poin >= l.ambang)
