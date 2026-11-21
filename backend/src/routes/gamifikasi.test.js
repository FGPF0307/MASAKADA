import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { buatApp } from '../app.js'
import { migrate } from '../db/migrate.js'
import { seed } from '../db/seed/seed.js'

process.env.SUPABASE_URL = 'https://x.test'
const FOTO = 'https://x.test/storage/v1/object/public/foto'
const P = {
  A: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', nama: 'Penulis' },
  B: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', nama: 'Pemasak' },
  ADMIN: { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', nama: 'Mod' },
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
for (const u of ['A', 'B', 'ADMIN']) await panggil('GET', '/saya', null, u)
await db.query("UPDATE profiles SET role='admin' WHERE id=$1", [P.ADMIN.id])
const poin = async (u) => (await db.query('SELECT poin FROM profiles WHERE id=$1', [P[u].id])).rows[0].poin
const idBahan = async (nama) => (await db.query('SELECT id FROM ingredients WHERE nama=$1', [nama])).rows[0].id
const tempe = await idBahan('Tempe')

// Menulis + menerbitkan satu resep sederhana milik penulis A lewat alur sungguhan.
async function terbitkan(judul, alat = []) {
  const id = (await panggil('POST', '/resep')).data.id
  const l = (instruksi) => ({ fase: 'memasak', instruksi, foto_url: `${FOTO}/s.jpg`, timer_menit: null, bahan: [tempe], alat: [] })
  const sv = await panggil('PATCH', `/resep/${id}`, {
    judul, foto_url: `${FOTO}/h.jpg`, kategori: 'Lauk', menit_persiapan: 5, menit_memasak: 10, alat,
    bahan: [{ ingredient_id: tempe, jumlah: 200, peran: 'utama' }], langkah: [l('Iris 200 g tempe.'), l('Goreng 10 menit.')],
  })
  assert.equal(sv.status, 200)
  assert.equal((await panggil('POST', `/resep/${id}/kirim`)).status, 200)
  assert.equal((await panggil('POST', `/admin/resep/${id}/setujui`, null, 'ADMIN')).status, 200)
  return id
}
const masak = (id, u = 'B') => panggil('POST', `/resep/${id}/selesai`, { lewati: true }, u)

test('resep terbit: +30 poin, level, lencana Recipe Creator, notifikasi', async () => {
  const id = await terbitkan('Tempe A')
  assert.equal(await poin('A'), 30)
  const c = (await panggil('GET', '/pencapaian')).data
  assert.deepEqual([c.poin, c.level.nama, c.berikutnya.nama, c.poin_ke_berikutnya], [30, 'New Contributor', 'Home Chef', 70])
  assert.equal(c.lencana.length, 6)
  assert.equal(c.lencana.find((b) => b.kode === 'recipe_creator').didapat, true)
  const prolific = c.lencana.find((b) => b.kode === 'prolific_cook')
  assert.deepEqual([prolific.progres, prolific.target, prolific.didapat], [1, 10, false])
  const n = (await panggil('GET', '/notifikasi')).data
  assert.deepEqual(n.daftar.map((x) => x.jenis).sort(), ['lencana_baru', 'resep_terbit'])
  assert.equal(n.belum_dibaca, 2)
  assert.equal((await panggil('POST', `/notifikasi/${n.daftar[0].id}/baca`)).status, 200)
  assert.equal((await panggil('POST', '/notifikasi/baca-semua')).status, 200)
  assert.equal((await panggil('GET', '/notifikasi')).data.belum_dibaca, 0)
  assert.equal((await panggil('GET', '/notifikasi', null, 'B')).data.daftar.length, 0) // milik sendiri saja
  assert.ok(id)
})

test('orang lain memasak: +5 sekali per orang per bulan; memasak resep sendiri tidak dapat poin', async () => {
  const id = (await db.query("SELECT id FROM recipes WHERE judul='Tempe A'")).rows[0].id
  await masak(id)
  assert.equal(await poin('A'), 35)
  await masak(id) // orang yang sama lagi bulan ini
  assert.equal(await poin('A'), 35)
  await masak(id, 'A') // penulis sendiri
  assert.equal(await poin('A'), 35)
  assert.equal((await panggil('GET', '/pencapaian')).data.lencana.find((b) => b.kode === 'sering_dimasak').progres, 2)
})

test('bintang 4–5 dari orang lain: +3 sekali; bintang 3 tidak memberi poin', async () => {
  const id = (await db.query("SELECT id FROM recipes WHERE judul='Tempe A'")).rows[0].id
  await panggil('PUT', `/resep/${id}/rating`, { bintang: 3 }, 'B')
  assert.equal(await poin('A'), 35)
  await panggil('PUT', `/resep/${id}/rating`, { bintang: 5 }, 'B')
  assert.equal(await poin('A'), 38)
  await panggil('PUT', `/resep/${id}/rating`, { bintang: 4 }, 'B') // ubah antar 4–5 tidak dihitung lagi
  assert.equal(await poin('A'), 38)
})

test('batas 50 poin per resep per bulan dari orang yang memasak; baris batas dicatat sekali', async () => {
  const id = (await db.query("SELECT id FROM recipes WHERE judul='Tempe A'")).rows[0].id
  await db.query('DELETE FROM cook_history WHERE recipe_id=$1', [id])
  await db.query("UPDATE points_log SET poin = 45 WHERE aksi='dimasak_orang' AND recipe_id=$1", [id]) // sudah dekat batas
  const sebelum = await poin('A')
  for (const [i, uid] of [['x1', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'], ['x2', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'], ['x3', 'ffffffff-ffff-4fff-8fff-ffffffffffff']]) {
    P[i] = { id: uid, nama: i }
    await panggil('GET', '/saya', null, i)
    await masak(id, i)
  }
  // x1 → total 50 (+5), x2 & x3 → batas tercapai (0)
  assert.equal(await poin('A'), sebelum + 5)
  assert.equal((await db.query("SELECT count(*)::int n FROM points_log WHERE aksi='batas_bulanan' AND recipe_id=$1", [id])).rows[0].n, 1)
})

test('pelanggan Plus mendapat bonus 10% (dibulatkan ke bawah) sebagai baris terpisah', async () => {
  await db.query("UPDATE profiles SET paket='plus' WHERE id=$1", [P.A.id])
  const sebelum = await poin('A')
  const id2 = await terbitkan('Tempe Plus')
  assert.equal(await poin('A'), sebelum + 33) // 30 + floor(3.0)
  assert.equal((await db.query("SELECT poin FROM points_log WHERE aksi='bonus_plus' AND recipe_id=$1", [id2])).rows[0].poin, 3)
})

test('resep diturunkan lewat laporan: semua poin dari resep itu dicabut, tidak di bawah 0', async () => {
  const id = (await db.query("SELECT id FROM recipes WHERE judul='Tempe A'")).rows[0].id
  const sebelum = await poin('A')
  const dariResep = (await db.query('SELECT sum(poin)::int s FROM points_log WHERE recipe_id=$1', [id])).rows[0].s
  await panggil('POST', '/laporan', { recipe_id: id, alasan: 'Spam' }, 'B')
  const lap = (await panggil('GET', '/admin/antrean', null, 'ADMIN')).data.laporan[0]
  assert.equal((await panggil('POST', `/admin/laporan/${lap.id}/selesai`, { turunkan_resep: true }, 'ADMIN')).status, 200)
  assert.equal(await poin('A'), Math.max(0, sebelum - dariResep)) // log dimanipulasi di test sebelumnya, jadi bisa menyentuh 0
  assert.equal((await db.query("SELECT poin FROM points_log WHERE aksi='resep_dihapus' AND recipe_id=$1", [id])).rows[0].poin, -dariResep)
  const riwayat = (await panggil('GET', '/pencapaian/riwayat-poin')).data
  assert.equal(riwayat.total, (await db.query('SELECT sum(poin)::int s FROM points_log WHERE user_id=$1', [P.A.id])).rows[0].s)
  assert.ok(riwayat.daftar.some((x) => x.aksi === 'resep_dihapus' && x.poin < 0))
})

test('level naik sesuai ambang poin', async () => {
  await db.query('UPDATE profiles SET poin=$2 WHERE id=$1', [P.A.id, 100])
  assert.equal((await panggil('GET', '/pencapaian')).data.level.nama, 'Home Chef')
  await db.query('UPDATE profiles SET poin=$2 WHERE id=$1', [P.A.id, 700])
  const c = (await panggil('GET', '/pencapaian')).data
  assert.deepEqual([c.level.nama, c.berikutnya, c.poin_ke_berikutnya], ['Zero-Waste Master', null, 0])
})
