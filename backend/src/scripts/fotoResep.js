import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { pool } from '../db/pool.js'
import { resep } from '../db/seed/data.js'
import { SINTA_ID } from '../db/seed/seed.js'
import { pastikanBucket } from '../services/storage.js'

// Mengisi foto resep demo: cari foto berlisensi bebas di Wikimedia Commons, simpan ke bucket Supabase sendiri,
// lalu isi recipes.foto_url. Hanya resep yang belum punya foto.
// Jalankan: npm run db:foto   ·   ganti semua: -- --ulang   ·   ganti tertentu: -- --ganti="Tumis Bayam,Kari Ayam"
const UA = 'MasakAdaSeed/1.0 (student project; seed script)'
const LISENSI = /^(cc0|public domain|cc by(-sa)? [1-4]\.0)/i
const ulang = process.argv.includes('--ulang')
const ganti = new Set((process.argv.find((a) => a.startsWith('--ganti='))?.slice(8) ?? '').split(',').map((x) => x.trim()).filter(Boolean))
const tidur = (ms) => new Promise((r) => setTimeout(r, ms))
const terpakai = new Set()

// Commons membatasi permintaan beruntun; tunggu lalu coba lagi.
async function ambil(url, coba = 4) {
  for (let i = 0; ; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok) return res
    if (i >= coba || ![429, 403, 503].includes(res.status)) throw new Error(`HTTP ${res.status}`)
    await tidur(5000 * (i + 1))
  }
}
const base = process.env.SUPABASE_URL
const kunci = process.env.SUPABASE_SERVICE_KEY
const bucket = process.env.SUPABASE_BUCKET ?? 'foto'
const polos = (html = '') => html.replace(/<[^>]+>/g, '').trim()
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function cariFoto(kata) {
  const q = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '15',
    gsrsearch: `${kata} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '960',
  })
  const res = await ambil(`https://commons.wikimedia.org/w/api.php?${q}`)
  const halaman = Object.values((await res.json()).query?.pages ?? {}).sort((a, b) => a.index - b.index)
  for (const p of halaman) {
    const info = p.imageinfo?.[0]
    const meta = info?.extmetadata ?? {}
    const lisensi = polos(meta.LicenseShortName?.value)
    if (info?.mime !== 'image/jpeg' || info.width < 600 || info.width < info.height * 0.9 || !LISENSI.test(lisensi) || terpakai.has(p.title)) continue
    return { url: info.thumburl ?? info.url, sumber: info.descriptionurl, lisensi, pembuat: polos(meta.Artist?.value) || 'Tidak diketahui', judul: p.title }
  }
  return null
}

await pastikanBucket()
const { rows } = await pool.query('SELECT id, judul, foto_url FROM recipes WHERE penulis_id = $1', [SINTA_ID])
const berkas = new URL('../../FOTO_KREDIT.md', import.meta.url)
const kredit = new Map()
try {
  for (const baris of readFileSync(berkas, 'utf8').split('\n').filter((b) => b.startsWith('| ') && !b.startsWith('| Resep'))) {
    kredit.set(baris.split(' | ')[0].slice(2), baris)
    terpakai.add('File:' + baris.match(/\[([^\]]+)\]/)?.[1])
  }
} catch { /* belum ada */ }

for (const r of rows) {
  const data = resep.find((x) => x.judul === r.judul)
  if (!data?.foto || (r.foto_url && !ulang && !ganti.has(r.judul))) continue
  if (ganti.has(r.judul)) terpakai.delete('File:' + kredit.get(r.judul)?.match(/\[([^\]]+)\]/)?.[1])
  await tidur(1500)
  try {
    const foto = await cariFoto(data.foto)
    if (!foto) { console.log(`✗ ${r.judul}: tidak ada foto yang cocok`); continue }
    terpakai.add(foto.judul)
    const isi = Buffer.from(await (await ambil(foto.url)).arrayBuffer())
    const path = `seed/${slug(r.judul)}.jpg`
    const up = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: { apikey: kunci, Authorization: `Bearer ${kunci}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
      body: isi,
    })
    if (!up.ok) throw new Error(`unggah gagal ${up.status}: ${await up.text()}`)
    const url = `${base}/storage/v1/object/public/${bucket}/${path}`
    await pool.query('UPDATE recipes SET foto_url = $2 WHERE id = $1', [r.id, url])
    kredit.set(r.judul, `| ${r.judul} | [${foto.judul.replace('File:', '')}](${foto.sumber}) | ${foto.pembuat} | ${foto.lisensi} |`)
    console.log(`✓ ${r.judul} ← ${foto.judul} (${foto.lisensi})`)
  } catch (e) {
    console.log(`✗ ${r.judul}: ${e.message}`)
  }
}
if (kredit.size) {
  writeFileSync(berkas, `# Kredit foto resep demo\n\nFoto dari Wikimedia Commons, dipakai sesuai lisensinya.\n\n| Resep | Berkas | Pembuat | Lisensi |\n|---|---|---|---|\n${[...kredit.values()].join('\n')}\n`)
  console.log('Kredit ditulis ke backend/FOTO_KREDIT.md')
}
await pool.end()
