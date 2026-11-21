import { t } from '../copy/id'

// Mengecilkan foto di browser sebelum diunggah: sisi terpanjang ≤ 1080 px, JPEG, ±200 KB (spesifikasi bagian 3).
export async function kompresFoto(file, { sisiMaks = 1080, batasKB = 250 } = {}) {
  if (!file?.type?.startsWith('image/')) throw new Error(t.foto.bukanGambar)
  const gambar = await createImageBitmap(file).catch(() => { throw new Error(t.foto.bukanGambar) })
  const skala = Math.min(1, sisiMaks / Math.max(gambar.width, gambar.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(gambar.width * skala)
  canvas.height = Math.round(gambar.height * skala)
  canvas.getContext('2d').drawImage(gambar, 0, 0, canvas.width, canvas.height)
  gambar.close?.()

  let blob
  for (let mutu = 0.85; mutu >= 0.4; mutu -= 0.15) {
    blob = await new Promise((selesai) => canvas.toBlob(selesai, 'image/jpeg', mutu))
    if (blob && blob.size <= batasKB * 1024) break
  }
  if (!blob) throw new Error(t.foto.bukanGambar)
  return blob
}
