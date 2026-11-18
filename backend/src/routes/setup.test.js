import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { buatApp } from '../app.js'
import { migrate } from '../db/migrate.js'
import { seed } from '../db/seed/seed.js'

const db = new PGlite()
await migrate(db)
await seed(db)
const server = buatApp({ db, authMw: (req, _res, next) => ((req.user = { id: '11111111-1111-4111-8111-111111111111', nama: 'Nazlan' }), next()) }).listen(0)
const base = `http://localhost:${server.address().port}/api`
test.after(() => { server.close(); return db.close() })

const panggil = async (metode, path, body) => {
  const res = await fetch(base + path, { method: metode, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })
  return { status: res.status, data: await res.json().catch(() => null) } // 204 tanpa isi
}
const id = async (nama) => (await db.query('SELECT id FROM ingredients WHERE nama=$1', [nama])).rows[0].id

test('profil dibuat otomatis dan preferensi bisa diubah', async () => {
  const { data } = await panggil('GET', '/saya')
  assert.equal(data.nama, 'Nazlan')
  assert.equal(data.setup_selesai, false)
  const p = await panggil('PATCH', '/saya', { level_keahlian: 'mahir', porsi_default: 2, tampilkan_kurang1: false })
  assert.deepEqual([p.data.level_keahlian, p.data.porsi_default, p.data.tampilkan_kurang1], ['mahir', 2, false])
  assert.equal((await panggil('PATCH', '/saya', { level_keahlian: 'gila' })).status, 400)
  assert.equal((await panggil('PATCH', '/saya', { level_pedas: 'pedas' })).status, 400) // fitur pedas dihapus
  assert.equal((await panggil('PATCH', '/saya', { poin: 999 })).status, 400) // kolom tak boleh diubah
})

test('saran bahan: nama dan sinonim', async () => {
  const { data } = await panggil('GET', '/bahan?q=dada%20ay')
  assert.equal(data[0].nama, 'Ayam')
  assert.ok((await panggil('GET', '/bahan/kategori/protein')).data.length > 5)
})

test('pantry: jumlah ditambahkan, 0 disembunyikan, validasi', async () => {
  const ayam = await id('Ayam')
  await panggil('POST', '/pantry', { ingredient_id: ayam, jumlah: 200, tempat: 'kulkas' })
  const dua = await panggil('POST', '/pantry', { ingredient_id: ayam, jumlah: 100, tempat: 'kulkas' })
  assert.equal(dua.data.jumlah, 300)
  assert.equal((await panggil('GET', '/pantry')).data.length, 1)
  assert.equal((await panggil('POST', '/pantry', { ingredient_id: ayam, jumlah: 0 })).status, 400)
  assert.equal((await panggil('POST', '/pantry', { ingredient_id: 99999, jumlah: 1 })).status, 404)
})

test('alat dan bahan pokok tersimpan; bahan pokok default selalu ikut', async () => {
  const rc = (await db.query("SELECT id FROM tools WHERE nama='Rice cooker'")).rows[0].id
  const kompor = (await db.query("SELECT id FROM tools WHERE nama='Kompor'")).rows[0].id
  await panggil('PUT', '/saya/alat', [{ tool_id: rc, punya: true }, { tool_id: kompor, punya: false }])
  const alat = (await panggil('GET', '/alat')).data
  assert.equal(alat.find((a) => a.nama === 'Rice cooker').punya, true)
  assert.equal(alat.find((a) => a.nama === 'Kompor').punya, false)
  assert.equal(alat.find((a) => a.nama === 'Oven').punya, false)

  await panggil('PUT', '/saya/bahan-pokok', [await id('Bawang putih')])
  const pokok = (await panggil('GET', '/bahan/pokok')).data
  const dipilih = pokok.filter((b) => b.dipilih).map((b) => b.nama).sort()
  assert.deepEqual(dipilih, ['Air', 'Bawang putih', 'Garam', 'Minyak goreng'])
  assert.equal(pokok.find((b) => b.nama === 'Garam').terkunci, true)
  assert.equal(pokok.find((b) => b.nama === 'Gula pasir').dipilih, false)
  // mengganti pilihan menghapus yang tidak dipilih lagi
  await panggil('PUT', '/saya/bahan-pokok', [await id('Gula pasir')])
  const lagi = (await panggil('GET', '/bahan/pokok')).data.filter((b) => b.dipilih).map((b) => b.nama).sort()
  assert.deepEqual(lagi, ['Air', 'Garam', 'Gula pasir', 'Minyak goreng'])
})

test('setup selesai', async () => {
  assert.equal((await panggil('POST', '/saya/setup-selesai')).data.setup_selesai, true)
})

test('pantry: ubah jumlah/tempat (menggantikan), hapus, 404', async () => {
  const [item] = (await panggil('GET', '/pantry')).data
  const ubah = await panggil('PATCH', `/pantry/${item.id}`, { jumlah: 150, tempat: 'freezer' })
  assert.deepEqual([ubah.data.jumlah, ubah.data.tempat], [150, 'freezer'])
  assert.equal((await panggil('GET', '/pantry?tempat=freezer')).data.length, 1)
  assert.equal((await panggil('GET', '/pantry?tempat=kulkas')).data.length, 0)
  assert.equal((await panggil('PATCH', `/pantry/${item.id}`, { jumlah: -1 })).status, 400)
  assert.equal((await panggil('GET', `/pantry/${item.id}`)).data.nama, 'Ayam')
  assert.equal((await panggil('GET', '/pantry/bukan-uuid')).status, 404)
  assert.equal((await panggil('DELETE', `/pantry/${item.id}`)).status, 204)
  assert.equal((await panggil('DELETE', `/pantry/${item.id}`)).status, 404)
  assert.equal((await panggil('GET', '/pantry')).data.length, 0)
})

test('bahan baru: menunggu persetujuan, bisa masuk pantry sendiri, tolak duplikat/tidak valid', async () => {
  const baru = await panggil('POST', '/bahan', { nama: 'Mascarpone', sinonim: ['keju mascarpone'], satuan: 'g', kategori: 'susu' })
  assert.equal(baru.status, 201)
  assert.equal(baru.data.belum_baku, true)
  assert.equal((await db.query("SELECT status FROM ingredients WHERE nama='Mascarpone'")).rows[0].status, 'menunggu')
  assert.equal((await panggil('GET', '/bahan?q=masc')).data[0].belum_baku, true)
  assert.equal((await panggil('GET', `/bahan/${baru.data.id}`)).data.nama, 'Mascarpone')
  assert.equal((await panggil('POST', '/pantry', { ingredient_id: baru.data.id, jumlah: 100, tempat: 'kulkas' })).status, 201)
  assert.equal((await panggil('POST', '/bahan', { nama: 'dada ayam', satuan: 'g', kategori: 'protein' })).status, 409) // sinonim yang ada
  assert.equal((await panggil('POST', '/bahan', { nama: 'Zzz', satuan: 'kg', kategori: 'protein' })).status, 400)
  assert.deepEqual((await panggil('GET', '/bahan/baru-dipakai')).data, [])
})
