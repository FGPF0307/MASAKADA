import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { buatApp } from '../app.js'
import { migrate } from '../db/migrate.js'
import { seed } from '../db/seed/seed.js'
import { awalPeriode } from '../services/kuota.js'
import { tiketUntuk } from './bisa.js'

process.env.AI_MOCK = 'true'
const P = {
  A: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', nama: 'Plus' },
  B: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', nama: 'Gratis' },
  C: { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', nama: 'Gratis2' },
}
const db = new PGlite()
await migrate(db)
await seed(db)
const server = buatApp({ db, authMw: (req, _res, next) => ((req.user = P[req.headers['x-user'] ?? 'A']), next()) }).listen(0)
const base = `http://localhost:${server.address().port}/api`
test.after(() => { server.close(); return db.close() })

const panggil = async (metode, path, body, user = 'A') => {
  const res = await fetch(base + path, { method: metode, headers: { 'Content-Type': 'application/json', 'x-user': user }, body: body && JSON.stringify(body) })
  return { status: res.status, data: await res.json().catch(() => null) }
}
for (const u of ['A', 'B', 'C']) await panggil('GET', '/saya', null, u)
const idResep = async (judul) => (await db.query('SELECT id FROM recipes WHERE judul=$1', [judul])).rows[0].id
const idBahan = async (nama) => (await db.query('SELECT id FROM ingredients WHERE nama=$1', [nama])).rows[0].id
const ayam = await idResep('Ayam Kecap Rice Cooker')
const eksklusif = await idResep('Nasi Goreng Zero-Waste Sinta')

test('awalPeriode: Senin 00:00 WIB dan tanggal 1 WIB', () => {
  // Rabu 2026-11-18 10:00 WIB → Senin 2026-11-16 00:00 WIB = 2026-11-15 17:00 UTC
  assert.equal(awalPeriode('minggu', new Date('2026-11-18T03:00:00Z')).toISOString(), '2026-11-15T17:00:00.000Z')
  // Minggu 22:00 WIB masih minggu yang sama
  assert.equal(awalPeriode('minggu', new Date('2026-11-22T15:00:00Z')).toISOString(), '2026-11-15T17:00:00.000Z')
  assert.equal(awalPeriode('bulan', new Date('2026-11-18T03:00:00Z')).toISOString(), '2026-10-31T17:00:00.000Z')
})

test('tiket workshop: Plus 1 gratis per bulan, lalu diskon 50%', () => {
  assert.deepEqual(tiketUntuk(false, 35000, false), { jenis: 'reguler', harga: 35000 })
  assert.deepEqual(tiketUntuk(true, 35000, false), { jenis: 'plus', harga: 0 })
  assert.deepEqual(tiketUntuk(true, 35000, true), { jenis: 'reguler', harga: 17500 })
  assert.deepEqual(tiketUntuk(true, 0, false), { jenis: 'reguler', harga: 0 })
})

test('favorit & koleksi: simpan, filter koleksi, hapus favorit mengeluarkannya dari koleksi', async () => {
  assert.equal((await panggil('POST', '/favorit', { recipe_id: ayam }, 'B')).status, 201)
  assert.equal((await panggil('POST', '/favorit', { recipe_id: 'bukan-uuid' }, 'B')).status, 404)
  const k = (await panggil('POST', '/koleksi', { nama: 'Anak kos' }, 'B')).data
  assert.equal((await panggil('POST', '/koleksi', { nama: 'anak kos' }, 'B')).status, 409)
  assert.equal((await panggil('POST', `/koleksi/${k.id}/resep`, { recipe_id: ayam }, 'B')).status, 201)
  assert.equal((await panggil('POST', `/koleksi/${k.id}/resep`, { recipe_id: ayam }, 'A')).status, 404) // koleksi milik B
  let f = (await panggil('GET', '/favorit', null, 'B')).data
  assert.deepEqual([f.total, f.resep.length, f.koleksi[0].jumlah], [1, 1, 1])
  assert.equal((await panggil('GET', `/favorit?koleksi=${k.id}`, null, 'B')).data.resep.length, 1)
  assert.equal((await panggil('GET', `/koleksi?recipe_id=${ayam}`, null, 'B')).data[0].ada, true)
  assert.equal((await panggil('GET', `/resep/${ayam}`, null, 'B')).data.favorit, true)
  assert.equal((await panggil('DELETE', `/favorit/${ayam}`, null, 'B')).status, 204)
  f = (await panggil('GET', '/favorit', null, 'B')).data
  assert.deepEqual([f.total, f.koleksi[0].jumlah], [0, 0])
})

test('riwayat memasak dan ringkasan profil', async () => {
  await panggil('POST', `/resep/${ayam}/selesai`, { lewati: true }, 'B')
  const h = (await panggil('GET', '/riwayat', null, 'B')).data
  assert.equal(h.bulan_ini, 1)
  assert.equal(h.daftar[0].judul, 'Ayam Kecap Rice Cooker')
  assert.equal(h.daftar[0].bisa_lagi, true)
  const s = (await panggil('GET', '/ringkasan-profil', null, 'B')).data
  assert.deepEqual([s.masakan, s.dibagikan, s.paket, s.chef.sisa, s.chef.batas], [1, 0, 'gratis', 3, 3])
})

test('Chef AI chat: gratis 3 per minggu, lalu 429', async () => {
  for (let i = 0; i < 3; i++) {
    const r = await panggil('POST', '/chef-ai/chat', { pesan: 'Berapa lama nasi matang tahan?' }, 'C')
    assert.equal(r.status, 200)
    assert.match(r.data.jawaban, /Nasi matang/)
    assert.equal(r.data.kuota.sisa, 2 - i)
  }
  const habis = await panggil('POST', '/chef-ai/chat', { pesan: 'Halo' }, 'C')
  assert.equal(habis.status, 429)
  assert.equal((await panggil('POST', '/chef-ai/chat', { pesan: '' }, 'B')).status, 400)
  const r = await panggil('GET', '/chef-ai/riwayat', null, 'C')
  assert.equal(r.data.pesan.length, 6)
  assert.equal(r.data.kuota.sisa, 0)
})

test('"masak apa?" dijawab dari matching pantry dengan kartu resep', async () => {
  const tempe = await idBahan('Tempe')
  await panggil('POST', '/pantry', { ingredient_id: tempe, jumlah: 500, tempat: 'kulkas' }, 'B')
  const r = await panggil('POST', '/chef-ai/chat', { pesan: 'Aku bisa masak apa?' }, 'B')
  assert.equal(r.status, 200)
  assert.ok(Array.isArray(r.data.kartu))
})

test('fitur Plus ditolak untuk pengguna Gratis (402)', async () => {
  const bahan = await idBahan('Kecap manis')
  assert.equal((await panggil('POST', '/chef-ai/substitusi', { recipe_id: ayam, ingredient_id: bahan }, 'B')).status, 402)
  assert.equal((await panggil('GET', '/perencana', null, 'B')).status, 402)
  assert.equal((await panggil('GET', `/resep/${eksklusif}/masak`, null, 'B')).status, 402)
  const d = (await panggil('GET', `/resep/${eksklusif}`, null, 'B')).data
  assert.deepEqual([d.terkunci, d.langkah.length, d.nutrisi], [true, 0, null])
})

test('Plus: aktifkan (simulasi), nutrisi, substitusi, scan, perencana', async () => {
  assert.equal((await panggil('POST', '/plus/aktifkan', { paket: 'x' })).status, 400)
  const a = await panggil('POST', '/plus/aktifkan', { paket: 'tahunan' })
  assert.equal(a.data.paket, 'plus')
  assert.ok(a.data.plus_sampai)
  assert.equal((await panggil('POST', '/plus/aktifkan', { paket: 'bulanan' })).status, 409)
  assert.deepEqual([a.data.kuota.chat.batas, a.data.kuota.scan.batas, a.data.kuota.substitusi.batas], [30, 30, 5])

  const detail = (await panggil('GET', `/resep/${ayam}`)).data
  assert.ok(detail.nutrisi.kalori_total > 0)
  assert.equal((await panggil('GET', `/resep/${eksklusif}`)).data.langkah.length > 0, true)

  // Substitusi: validasi server → maks 2, satuan ml (terkunci dari bahan), tanpa bahan yang sudah ada di resep.
  const kecap = await idBahan('Kecap manis')
  const s = await panggil('POST', '/chef-ai/substitusi', { recipe_id: ayam, ingredient_id: kecap, porsi: 2 })
  assert.equal(s.status, 200)
  assert.equal(s.data.bahan.butuh, 90)
  assert.ok(s.data.pilihan.length >= 1 && s.data.pilihan.length <= 2)
  assert.ok(s.data.pilihan.every((x) => x.satuan === 'ml' && x.ingredient_id !== kecap && x.jumlah > 0))
  assert.equal(s.data.kuota.sisa, 4)
  assert.equal((await panggil('POST', '/chef-ai/substitusi', { recipe_id: ayam, ingredient_id: await idBahan('Tahu') })).status, 404)

  // Scan: hasil belum disimpan sampai dikonfirmasi.
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)])
  const res = await fetch(`${base}/chef-ai/scan`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'x-user': 'A' }, body: jpeg })
  const scan = await res.json()
  assert.equal(res.status, 200)
  assert.ok(scan.items.length >= 3)
  assert.equal(scan.kuota.sisa, 29)
  assert.equal((await db.query('SELECT count(*)::int AS n FROM pantry_items WHERE user_id=$1', [P.A.id])).rows[0].n, 0)
  const palsu = await fetch(`${base}/chef-ai/scan`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'x-user': 'A' }, body: Buffer.from('bukan gambar') })
  assert.equal(palsu.status, 415)
  assert.equal((await panggil('POST', '/chef-ai/scan/konfirmasi', { tempat: 'kulkas', items: [{ ingredient_id: 999999, jumlah: 1 }] })).status, 400)
  const ok = await panggil('POST', '/chef-ai/scan/konfirmasi', { tempat: 'kulkas', items: scan.items.map((x) => ({ ingredient_id: x.ingredient_id, jumlah: x.jumlah })) })
  assert.equal(ok.status, 201)
  assert.equal((await db.query('SELECT count(*)::int AS n FROM pantry_items WHERE user_id=$1', [P.A.id])).rows[0].n, scan.items.length)

  // Perencana: 14 slot; kuota 3 per minggu (1 + 2 buat ulang).
  assert.equal((await panggil('GET', '/perencana')).data.ada, false)
  const p = await panggil('POST', '/perencana/buat-ulang')
  assert.equal(p.status, 201)
  assert.equal(p.data.slot.length, 14)
  assert.ok(p.data.slot.every((x) => x.resep))
  assert.equal((await panggil('POST', '/perencana/buat-ulang')).status, 201)
  assert.equal((await panggil('POST', '/perencana/buat-ulang')).status, 201)
  assert.equal((await panggil('POST', '/perencana/buat-ulang')).status, 429)
  const ganti = await panggil('PUT', '/perencana/slot', { hari: 1, waktu_makan: 'siang', recipe_id: ayam })
  assert.equal(ganti.data.slot[0].resep.id, ayam)
})

test('workshop: daftar, kursi, tiket Plus gratis, tiket saya', async () => {
  const daftar = (await panggil('GET', '/workshop', null, 'B')).data
  assert.equal(daftar.workshop.length, 4)
  const w = daftar.workshop.find((x) => x.harga === 35000)
  assert.deepEqual(w.tiket, { jenis: 'reguler', harga: 35000 })
  const detail = (await panggil('GET', `/workshop/${w.id}`, null, 'B')).data
  assert.ok(detail.pantry.total > 0)
  assert.equal((await panggil('POST', `/workshop/${w.id}/daftar`, {}, 'B')).status, 400) // butuh metode bayar
  assert.equal((await panggil('POST', `/workshop/${w.id}/daftar`, { jenis_tiket: 'plus', metode_bayar: 'qris' }, 'B')).status, 403)
  const ok = await panggil('POST', `/workshop/${w.id}/daftar`, { metode_bayar: 'qris' }, 'B')
  assert.equal(ok.status, 201)
  assert.match(ok.data.kode_tiket, /^MA-/)
  assert.equal((await panggil('POST', `/workshop/${w.id}/daftar`, { metode_bayar: 'qris' }, 'B')).status, 409)

  const plus = await panggil('POST', `/workshop/${w.id}/daftar`, { jenis_tiket: 'plus' }, 'A')
  assert.deepEqual([plus.status, plus.data.jenis_tiket, plus.data.harga], [201, 'plus', 0])
  const saya = (await panggil('GET', '/workshop/saya', null, 'A')).data
  assert.equal(saya.akan_datang.length, 1)
  assert.equal(saya.akan_datang[0].bisa_gabung, false)
  assert.equal((await panggil('GET', '/workshop/bukan-uuid')).status, 404)
})
