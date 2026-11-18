import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { buatApp } from '../app.js'
import { migrate } from '../db/migrate.js'
import { seed } from '../db/seed/seed.js'

const db = new PGlite()
await migrate(db)
await seed(db)
const server = buatApp({ db, authMw: (req, _res, next) => ((req.user = { id: '22222222-2222-4222-8222-222222222222', nama: 'Nazlan' }), next()) }).listen(0)
const base = `http://localhost:${server.address().port}/api`
test.after(() => { server.close(); return db.close() })

const panggil = async (metode, path, body) => {
  const res = await fetch(base + path, { method: metode, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })
  return { status: res.status, data: await res.json().catch(() => null) }
}
const id = async (nama) => (await db.query('SELECT id FROM ingredients WHERE nama=$1', [nama])).rows[0].id
const tool = async (nama) => (await db.query('SELECT id FROM tools WHERE nama=$1', [nama])).rows[0].id
const judul = (daftar) => daftar.map((x) => x.judul).sort()

// Pantry demo Nazlan (spesifikasi bagian 13); bahan pokok: air, garam, minyak (default) + bawang putih, gula pasir, merica.
await panggil('GET', '/saya')
for (const [nama, jumlah] of [['Ayam', 200], ['Telur', 6], ['Tahu', 4], ['Wortel', 2], ['Bayam', 200], ['Kangkung', 250], ['Nasi', 500], ['Tempe', 200]])
  await panggil('POST', '/pantry', { ingredient_id: await id(nama), jumlah })
await panggil('PUT', '/saya/bahan-pokok', await Promise.all(['Bawang putih', 'Gula pasir', 'Merica bubuk'].map(id)))

test('siap dimasak: semua bahan utama ada; kurang 1: tepat satu bahan utama kurang', async () => {
  const { data } = await panggil('GET', '/resep/cocok')
  assert.deepEqual(judul(data.siap), ['Kangkung Bawang Putih', 'Telur Dadar Tahu', 'Tumis Bayam'])
  const ayam = data.kurang1.find((x) => x.judul === 'Ayam Kecap Rice Cooker')
  assert.deepEqual(ayam.bahan_kurang.map((b) => b.nama), ['Kecap manis'])
  assert.equal(ayam.jumlah_kurang_takaran, 1) // Ayam 200 g < 300 g
  assert.equal(data.jumlah_pantry, 8)
  // resep yang kurang 2+ bahan tidak muncul di Beranda/Hasil
  assert.ok(![...data.siap, ...data.kurang1].some((x) => x.judul === 'Kari Ayam'))
  // bahan pokok & opsional tidak dihitung kurang (Telur Dadar Tahu: daun bawang opsional)
  assert.equal(data.siap.find((x) => x.judul === 'Telur Dadar Tahu').jumlah_kurang, 0)
})

test('takaran ikut porsi; bahan ada tapi kurang tetap siap dengan catatan', async () => {
  const { data } = await panggil('GET', '/resep/cocok?porsi=2')
  const bayam = data.siap.find((x) => x.judul === 'Tumis Bayam') // 2 × 200 g > 200 g di pantry
  assert.equal(bayam.jumlah_kurang_takaran, 1)
  assert.equal((await panggil('GET', '/resep/cocok?porsi=0')).status, 400)
})

test('filter waktu & kesulitan, urutan, validasi', async () => {
  assert.deepEqual(judul((await panggil('GET', '/resep/cocok?waktu=kilat')).data.siap), ['Telur Dadar Tahu']) // 12 mnt
  assert.deepEqual((await panggil('GET', '/resep/cocok?kesulitan=sulit')).data.siap, [])
  assert.equal((await panggil('GET', '/resep/cocok?urut=tercepat')).data.siap[0].judul, 'Telur Dadar Tahu')
  assert.equal((await panggil('GET', '/resep/cocok?waktu=ngebut')).status, 400)
  assert.equal((await panggil('GET', '/resep/cocok?alat=Rice cooker')).data.kurang1.length, 2)
})

test('urutan default: paling banyak memakai bahan pantry lebih dulu', async () => {
  const { siap } = (await panggil('GET', '/resep/cocok')).data
  for (let i = 1; i < siap.length; i++) assert.ok(siap[i - 1].bahan_pantry_terpakai >= siap[i].bahan_pantry_terpakai)
})

test('cari nama & bahan (sinonim), jelajahi per kategori dengan label', async () => {
  assert.deepEqual(judul((await panggil('GET', '/resep/cari?q=tahu&mode=nama')).data), ['Tahu Goreng Tepung', 'Telur Dadar Tahu'])
  const kol = (await panggil('GET', '/resep/cari?q=kubis&mode=bahan')).data // kubis = sinonim Kol
  assert.deepEqual(kol.map((x) => [x.judul, x.label]), [['Orak-arik Telur Kol', 1]])
  const rc = (await panggil('GET', '/resep/jelajahi?kategori=Rice%20cooker')).data
  assert.equal(rc.length, 2)
  assert.ok(rc.every((x) => x.label === 1))
  assert.equal((await panggil('GET', '/resep/jelajahi')).data.length, 15)
})

test('detail resep: status tiap bahan, skala porsi, ringkasan, level penulis', async () => {
  const { id: rid } = (await db.query("SELECT id FROM recipes WHERE judul='Ayam Kecap Rice Cooker'")).rows[0]
  const { data } = await panggil('GET', `/resep/${rid}`)
  const status = Object.fromEntries(data.bahan.map((b) => [b.nama, b.status]))
  assert.deepEqual(status, {
    Ayam: 'kurang_jumlah', 'Kecap manis': 'tidak_ada', Wortel: 'ada',
    'Bawang putih': 'pokok', Garam: 'pokok', Air: 'pokok', 'Cabai rawit': 'opsional',
  })
  const ayam = data.bahan.find((b) => b.nama === 'Ayam')
  assert.deepEqual([ayam.butuh, ayam.punya], [300, 200])
  assert.deepEqual(data.ringkasan.bahan_kurang.map((b) => b.nama), ['Kecap manis'])
  assert.equal(data.ringkasan.ada_kurang_takaran, true)
  assert.deepEqual([data.penulis, data.penulis_level, data.dicoba_orang, data.langkah.length, data.chip_waktu], ['Sinta', 'Home Chef', 0, 4, 'cepat'])
  assert.equal(data.alat[0].nama, 'Rice cooker')
  // porsi 2 → kebutuhan ×2: wortel 2 butir tepat cukup, ayam 600 g
  const dua = (await panggil('GET', `/resep/${rid}?porsi=2`)).data
  assert.equal(dua.bahan.find((b) => b.nama === 'Ayam').butuh, 600)
  assert.equal(dua.bahan.find((b) => b.nama === 'Wortel').status, 'ada')
  assert.equal((await panggil('GET', '/resep/00000000-0000-4000-8000-000000000000')).status, 404)
  assert.equal((await panggil('GET', '/resep/bukan-uuid')).status, 404)
})

test('toko mitra (simulasi)', async () => {
  assert.deepEqual((await panggil('GET', '/mitra')).data.map((m) => m.nama), ['Astro', 'Sayurbox', 'Gojek', 'Grab'])
})

test('alat: tanpa kompor hanya resep dengan alat yang dimiliki; alatLain menampilkan semuanya', async () => {
  await panggil('PUT', '/saya/alat', [{ tool_id: await tool('Kompor'), punya: false }])
  assert.deepEqual((await panggil('GET', '/resep/cocok')).data.siap, [])
  await panggil('PUT', '/saya/alat', [{ tool_id: await tool('Rice cooker'), punya: true }])
  const { data } = await panggil('GET', '/resep/cocok')
  assert.deepEqual(judul(data.kurang1), ['Ayam Kecap Rice Cooker', 'Tempe Kecap Rice Cooker'])
  assert.ok((await panggil('GET', '/resep/cocok?alatLain=true')).data.siap.length > 0)
})
