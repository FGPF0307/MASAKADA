import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { buatApp } from '../app.js'
import { migrate } from '../db/migrate.js'
import { seed } from '../db/seed/seed.js'

const db = new PGlite()
await migrate(db)
await seed(db)
const server = buatApp({ db, authMw: (req, _res, next) => ((req.user = { id: '33333333-3333-4333-8333-333333333333', nama: 'Nazlan' }), next()) }).listen(0)
const base = `http://localhost:${server.address().port}/api`
test.after(() => { server.close(); return db.close() })

const panggil = async (metode, path, body) => {
  const res = await fetch(base + path, { method: metode, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })
  return { status: res.status, data: await res.json().catch(() => null) }
}
const idBahan = async (nama) => (await db.query('SELECT id FROM ingredients WHERE nama=$1', [nama])).rows[0].id
const idResep = async (judul) => (await db.query('SELECT id FROM recipes WHERE judul=$1', [judul])).rows[0].id
const pantry = async () => Object.fromEntries((await panggil('GET', '/pantry')).data.map((p) => [p.nama, p.jumlah]))

await panggil('GET', '/saya')
for (const [nama, jumlah] of [['Bayam', 200], ['Telur', 6], ['Tahu', 4], ['Ayam', 200], ['Wortel', 2], ['Cabai rawit', 5]])
  await panggil('POST', '/pantry', { ingredient_id: await idBahan(nama), jumlah })
await panggil('PUT', '/saya/bahan-pokok', [await idBahan('Bawang putih')])

test('mode memasak: langkah dengan bahan & alat per langkah, takaran ikut porsi', async () => {
  const id = await idResep('Ayam Kecap Rice Cooker')
  const { data } = await panggil('GET', `/resep/${id}/masak`)
  assert.equal(data.langkah.length, 4)
  const l2 = data.langkah[1]
  assert.deepEqual([l2.fase, l2.timer_menit, l2.alat], ['memasak', 20, ['Rice cooker']])
  assert.deepEqual(l2.bahan.find((b) => b.nama === 'Kecap manis'), { nama: 'Kecap manis', satuan: 'ml', butuh: 45 })
  const dua = (await panggil('GET', `/resep/${id}/masak?porsi=2`)).data
  assert.equal(dua.langkah[1].bahan.find((b) => b.nama === 'Kecap manis').butuh, 90)
  assert.equal((await panggil('GET', '/resep/00000000-0000-4000-8000-000000000000/masak')).status, 404)
})

test('pratinjau stok: bahan pokok tidak ikut, jumlah diusulkan sesuai resep, opsional 0', async () => {
  const id = await idResep('Ayam Kecap Rice Cooker')
  const { data } = await panggil('GET', `/resep/${id}/selesai-pratinjau`)
  const per = Object.fromEntries(data.items.map((i) => [i.nama, i]))
  assert.equal(per.Ayam.usulan, 200) // butuh 300, punya 200 → semua dipakai
  assert.equal(per.Wortel.usulan, 1)
  assert.equal(per['Cabai rawit'].usulan, 0)
  assert.equal(per['Cabai rawit'].opsional, true)
  assert.equal(per['Bawang putih'], undefined) // bahan pokok pribadi
  assert.equal(per.Garam, undefined) // pokok default
  assert.equal(data.bulan_ini, 0)
})

test('selesai memasak: stok berkurang, 0 menghapus baris, riwayat & dicoba tercatat', async () => {
  const id = await idResep('Tumis Bayam')
  const a = await panggil('POST', `/resep/${id}/selesai`, { porsi: 1, items: [{ ingredient_id: await idBahan('Bayam'), jumlah_dipakai: 150 }] })
  assert.equal(a.status, 201)
  assert.deepEqual([a.data.bahan_terpakai, a.data.bahan_terpakai_bulan_ini, a.data.boleh_menilai], [1, 1, true])
  assert.equal((await pantry()).Bayam, 50)

  // pakai lebih dari sisa → stok tidak di bawah 0, baris dihapus
  const b = await panggil('POST', `/resep/${id}/selesai`, { items: [{ ingredient_id: await idBahan('Bayam'), jumlah_dipakai: 100 }] })
  assert.deepEqual(b.data.sisa_pantry.map((x) => [x.nama, x.sisa]), [['Bayam', 0]])
  assert.equal((await pantry()).Bayam, undefined)
  assert.equal(b.data.bahan_terpakai_bulan_ini, 2)

  // "Dicoba X orang" = pengguna berbeda, bukan jumlah masak
  assert.equal((await panggil('GET', `/resep/${id}`)).data.dicoba_orang, 1)
  assert.equal((await db.query('SELECT count(*)::int n FROM cook_history')).rows[0].n, 2)
})

test('bahan pokok tidak pernah dikurangi; bahan yang tidak di pantry diabaikan', async () => {
  const id = await idResep('Tumis Bayam')
  const { data } = await panggil('POST', `/resep/${id}/selesai`, { items: [{ ingredient_id: await idBahan('Bawang putih'), jumlah_dipakai: 8 }, { ingredient_id: await idBahan('Bayam'), jumlah_dipakai: 10 }] })
  assert.equal(data.bahan_terpakai, 0) // bayam sudah habis, bawang putih pokok
})

test('lewati: hanya mencatat riwayat, stok tidak berubah', async () => {
  const id = await idResep('Telur Dadar Tahu')
  const sebelum = await pantry()
  const { status, data } = await panggil('POST', `/resep/${id}/selesai`, { lewati: true })
  assert.equal(status, 201)
  assert.equal(data.bahan_terpakai, 0)
  assert.deepEqual(await pantry(), sebelum)
})

test('validasi: porsi, jumlah negatif, bahan di luar resep, resep tidak ada', async () => {
  const id = await idResep('Telur Dadar Tahu')
  const telur = await idBahan('Telur')
  assert.equal((await panggil('POST', `/resep/${id}/selesai`, { porsi: 0, items: [] })).status, 400)
  assert.equal((await panggil('POST', `/resep/${id}/selesai`, { items: [{ ingredient_id: telur, jumlah_dipakai: -1 }] })).status, 400)
  assert.equal((await panggil('POST', `/resep/${id}/selesai`, { items: [{ ingredient_id: await idBahan('Ayam'), jumlah_dipakai: 1 }] })).status, 400)
  assert.equal((await panggil('POST', '/resep/00000000-0000-4000-8000-000000000000/selesai', { lewati: true })).status, 404)
  assert.equal((await panggil('POST', `/resep/${id}/selesai`, { items: 'x' })).status, 400)
  assert.equal((await pantry()).Telur, 6) // tidak ada yang berubah
})
