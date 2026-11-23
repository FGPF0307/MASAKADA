import { randomUUID } from 'node:crypto'
import { galat } from '../middleware/error.js'

const EKSTENSI = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// Tanda pengenal file di awal isi, supaya file lain tidak bisa menyamar sebagai gambar.
const COCOK = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  'image/webp': (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
}
export const tipeGambarValid = (buffer, tipe) => !!COCOK[tipe]?.(buffer)

// Hanya URL foto dari bucket proyek sendiri yang boleh disimpan di komentar/resep.
export function urlFotoValid(url) {
  if (typeof url !== 'string' || url.length > 500) return false
  const base = process.env.SUPABASE_URL
  return base ? url.startsWith(`${base}/storage/v1/object/public/`) : /^https?:\/\//.test(url)
}

const konfig = () => {
  const base = process.env.SUPABASE_URL
  const kunci = process.env.SUPABASE_SERVICE_KEY
  if (!base || !kunci) throw galat(503, 'Penyimpanan foto belum dikonfigurasi.')
  return { base, bucket: process.env.SUPABASE_BUCKET ?? 'foto', h: { apikey: kunci, Authorization: `Bearer ${kunci}` } }
}

// Membuat bucket publik bila belum ada (aman dipanggil berulang). Batas 2 MB, hanya gambar.
export async function pastikanBucket() {
  const { base, bucket, h } = konfig()
  const cek = await fetch(`${base}/storage/v1/bucket/${bucket}`, { headers: h })
  if (cek.ok) return false
  const res = await fetch(`${base}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: bucket, name: bucket, public: true, file_size_limit: 2 * 1024 * 1024, allowed_mime_types: Object.keys(EKSTENSI) }),
  })
  if (!res.ok && !(await res.text()).includes('already exists')) throw new Error(`Gagal membuat bucket ${bucket}: ${res.status}`)
  return true
}

// Mengunggah ke Supabase Storage (REST) dengan kunci rahasia server; mengembalikan URL publik.
// Bila bucket belum ada, bucket dibuat lalu unggahan dicoba sekali lagi.
export async function unggahFoto(buffer, tipe, userId) {
  const { base, bucket, h } = konfig()
  const path = `${userId}/${randomUUID()}.${EKSTENSI[tipe]}`
  const kirim = () => fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { ...h, 'Content-Type': tipe },
    body: buffer,
  })
  let res = await kirim()
  if (!res.ok) {
    const isi = await res.text()
    if (isi.includes('Bucket not found')) {
      await pastikanBucket()
      res = await kirim()
    } else {
      console.error('Storage gagal', res.status, isi)
      throw galat(502, 'Gagal mengunggah foto. Coba lagi sebentar.')
    }
  }
  if (!res.ok) {
    console.error('Storage gagal', res.status, await res.text())
    throw galat(502, 'Gagal mengunggah foto. Coba lagi sebentar.')
  }
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}
