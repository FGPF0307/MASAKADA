import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { buatApp } from '../app.js'
import { migrate } from '../db/migrate.js'
import { seed } from '../db/seed/seed.js'

process.env.SUPABASE_URL = 'https://x.test'
const FOTO = 'https://x.test/storage/v1/object/public/foto'
const PENGGUNA = {
  A: { id: '66666666-6666-4666-8666-666666666666', nama: 'Nazlan' },
  B: { id: '77777777-7777-4777-8777-777777777777', nama: 'Rani' },
  ADMIN: { id: '88888888-8888-4888-8888-888888888888', nama: 'Moderator' },
}
const db = new PGlite()
await migrate(db)
await seed(db)
const server = buatApp({ db, authMw: (req, _res, next) => ((req.user = PENGGUNA[req.headers['x-user'] ?? 'A']), next()) }).listen(0)
const base = `http://localhost:${server.address().port}/api`
test.after(() => { server.close(); return db.close() })

const panggil = async (metode, path, body, user = 'A') => {
  const res = await fetch(base + path, { method: metode, headers: { 'Content-Type': 'application/json', 'x-user': user }, body: body && JSON.stringify(body) })
  return { status: res.status, data: await res.json().catch(() => null) }
}
const idBahan = async (nama) => (await db.query('SELECT id FROM ingredients WHERE nama=$1', [nama])).rows[0].id
for (const u of ['A', 'B', 'ADMIN']) await panggil('GET', '/saya', null, u)
await db.query("UPDATE profiles SET role='admin' WHERE id=$1", [PENGGUNA.ADMIN.id])

const tempe = await idBahan('Tempe')
const garam = await idBahan('Garam')
const LENGKAP = {
  judul: 'Tempe Goreng Garam', deskripsi: 'Renyah.', foto_url: `${FOTO}/hasil.jpg`, kategori: 'Lauk', porsi: 2,
  menit_persiapan: 5, menit_memasak: 10, kesulitan: 'mudah',
  bahan: [{ ingredient_id: tempe, jumlah: 200, peran: 'utama' }, { ingredient_id: garam, jumlah: 3, peran: 'bumbu_dasar' }],
  langkah: [
    { fase: 'persiapan', instruksi: 'Iris 200 g tempe dan campur dengan 3 g garam.', foto_url: `${FOTO}/1.jpg`, timer_menit: null, bahan: [tempe, garam], alat: [] },
    { fase: 'memasak', instruksi: 'Goreng tempe 10 menit sampai kecokelatan.', foto_url: `${FOTO}/2.jpg`, timer_menit: 10, bahan: [tempe], alat: [] },
  ],
}
let id

test('draf: dibuat kosong, disimpan bertahap, divalidasi dengan daftar perbaikan', async () => {
  const baru = await panggil('POST', '/resep')
  assert.equal(baru.status, 201)
  id = baru.data.id
  const kosong = (await panggil('POST', `/resep/${id}/validasi`)).data
  assert.equal(kosong.ok, false)
  assert.deepEqual(kosong.checks.filter((c) => !c.ok).map((c) => c.kode).sort(), ['bahan_utama', 'foto_hasil', 'judul', 'min_langkah', 'waktu'])

  const buruk = { ...LENGKAP, langkah: [{ ...LENGKAP.langkah[0], instruksi: 'Garam secukupnya.', foto_url: null }, LENGKAP.langkah[1]] }
  assert.equal((await panggil('PATCH', `/resep/${id}`, buruk)).status, 200)
  const v = (await panggil('POST', `/resep/${id}/validasi`)).data
  assert.deepEqual(v.checks.filter((c) => !c.ok).map((c) => [c.kode, c.langkah]), [['takaran_pasti', 1], ['foto_langkah', 1]])
  assert.equal(v.perlu_diperbaiki, 2)
  assert.equal((await panggil('POST', `/resep/${id}/kirim`)).status, 422) // tidak bisa dikirim
})

test('validasi input penyimpanan: peran, jumlah, bahan ganda, foto asing, bahan di luar resep', async () => {
  const p = (b) => panggil('PATCH', `/resep/${id}`, b)
  assert.equal((await p({ kesulitan: 'gila' })).status, 400)
  assert.equal((await p({ menit_memasak: 999 })).status, 400)
  assert.equal((await p({ foto_url: 'https://evil.test/a.jpg' })).status, 400)
  assert.equal((await p({ bahan: [{ ingredient_id: tempe, jumlah: 0, peran: 'utama' }] })).status, 400)
  assert.equal((await p({ bahan: [{ ingredient_id: tempe, jumlah: 1, peran: 'utama' }, { ingredient_id: tempe, jumlah: 1, peran: 'opsional' }] })).status, 400)
  assert.equal((await p({ bahan: [{ ingredient_id: 99999, jumlah: 1, peran: 'utama' }] })).status, 400)
  assert.equal((await p({ langkah: [{ fase: 'memasak', instruksi: 'x', bahan: [await idBahan('Ayam')], alat: [] }] })).status, 400)
  assert.equal((await panggil('PATCH', `/resep/${id}`, { judul: 'x' }, 'B')).status, 404) // bukan milik B
})

test('perbaiki → kirim → status ditinjau, tidak bisa diubah, belum terlihat pengguna lain', async () => {
  assert.equal((await panggil('PATCH', `/resep/${id}`, LENGKAP)).status, 200)
  const d = (await panggil('GET', `/resep-saya/${id}`)).data
  assert.deepEqual([d.langkah.length, d.langkah[0].bahan.length, d.bahan.length], [2, 2, 2])
  assert.equal((await panggil('POST', `/resep/${id}/validasi`)).data.ok, true)
  assert.equal((await panggil('POST', `/resep/${id}/kirim`)).data.status, 'ditinjau')
  assert.equal((await panggil('PATCH', `/resep/${id}`, { judul: 'ubah' })).status, 409)
  assert.equal((await panggil('GET', `/resep/${id}`, null, 'B')).status, 404) // belum terbit
  assert.equal((await panggil('GET', `/resep-saya/${id}`, null, 'B')).status, 404)
  const saya = (await panggil('GET', '/resep-saya')).data
  assert.deepEqual(saya.jumlah, { draf: 0, ditinjau: 1, terbit: 0, ditolak: 0 })
})

test('admin: hanya moderator; tolak dengan alasan → penulis bisa memperbaiki dan kirim ulang', async () => {
  assert.equal((await panggil('GET', '/admin/antrean', null, 'A')).status, 403)
  const antre = (await panggil('GET', '/admin/antrean', null, 'ADMIN')).data
  assert.deepEqual(antre.resep.map((x) => x.judul), ['Tempe Goreng Garam'])
  assert.equal((await panggil('POST', `/admin/resep/${id}/tolak`, { catatan: [] }, 'ADMIN')).status, 400)
  assert.equal((await panggil('POST', `/admin/resep/${id}/tolak`, { catatan: [{ judul: 'Takaran garam kurang jelas', isi: 'Tulis dalam gram.' }] }, 'ADMIN')).status, 200)
  const d = (await panggil('GET', `/resep-saya/${id}`)).data
  assert.equal(d.status, 'ditolak')
  assert.deepEqual(d.catatan_penolakan, [{ no: 1, judul: 'Takaran garam kurang jelas', isi: 'Tulis dalam gram.' }])
  assert.equal((await db.query("SELECT count(*)::int n FROM notifications WHERE jenis='resep_ditolak'")).rows[0].n, 1)

  assert.equal((await panggil('PATCH', `/resep/${id}`, { deskripsi: 'Renyah dan gurih.' })).status, 200) // edit → kembali draf
  assert.equal((await panggil('GET', `/resep-saya/${id}`)).data.status, 'draf')
  assert.equal((await panggil('POST', `/resep/${id}/kirim`)).status, 200)
})

test('admin setujui → terbit, muncul di Jelajahi, notifikasi terkirim', async () => {
  assert.equal((await panggil('POST', `/admin/resep/${id}/setujui`, null, 'ADMIN')).status, 200)
  const jel = (await panggil('GET', '/resep/jelajahi', null, 'B')).data
  assert.ok(jel.some((x) => x.judul === 'Tempe Goreng Garam'))
  assert.equal((await panggil('GET', `/resep/${id}`, null, 'B')).data.penulis, 'Nazlan')
  assert.equal((await db.query("SELECT count(*)::int n FROM notifications WHERE jenis='resep_terbit'")).rows[0].n, 1)
  assert.equal((await panggil('POST', `/admin/resep/${id}/setujui`, null, 'ADMIN')).status, 404) // sudah tidak di antrean
  assert.equal((await panggil('DELETE', `/resep-saya/${id}`)).status, 409) // terbit tidak bisa dihapus
})

test('bahan baru: resep tidak bisa disetujui sebelum bahannya; gabung memindahkan semua pemakaian', async () => {
  const baru = (await panggil('POST', '/bahan', { nama: 'Mascarpone', satuan: 'g', kategori: 'susu' }, 'B')).data
  await panggil('POST', '/pantry', { ingredient_id: baru.id, jumlah: 50 }, 'B')
  const r2 = (await panggil('POST', '/resep', null, 'B')).data.id
  await panggil('PATCH', `/resep/${r2}`, { ...LENGKAP, judul: 'Dessert', bahan: [{ ingredient_id: baru.id, jumlah: 50, peran: 'utama' }], langkah: LENGKAP.langkah.map((l) => ({ ...l, bahan: [baru.id] })) }, 'B')
  assert.equal((await panggil('POST', `/resep/${r2}/kirim`, null, 'B')).status, 200)
  assert.equal((await panggil('POST', `/admin/resep/${r2}/setujui`, null, 'ADMIN')).status, 409)

  const keju = await idBahan('Keju krim')
  assert.equal((await panggil('POST', `/admin/bahan/${baru.id}/gabung`, { ke_id: keju }, 'ADMIN')).status, 200)
  assert.equal((await db.query("SELECT count(*)::int n FROM ingredients WHERE nama='Mascarpone'")).rows[0].n, 0)
  assert.ok((await db.query("SELECT 'Mascarpone' = ANY(sinonim) AS ok FROM ingredients WHERE id=$1", [keju])).rows[0].ok)
  assert.equal((await db.query('SELECT count(*)::int n FROM recipe_ingredients WHERE recipe_id=$1 AND ingredient_id=$2', [r2, keju])).rows[0].n, 1)
  assert.equal((await db.query('SELECT jumlah::float j FROM pantry_items WHERE user_id=$1 AND ingredient_id=$2', [PENGGUNA.B.id, keju])).rows[0].j, 50)
  assert.equal((await panggil('POST', `/admin/resep/${r2}/setujui`, null, 'ADMIN')).status, 200)
})

test('bahan baru: setujui dengan perubahan nama/satuan, atau tolak', async () => {
  const a = (await panggil('POST', '/bahan', { nama: 'Daun jeruk', satuan: 'g', kategori: 'sayur' }, 'A')).data
  const b = (await panggil('POST', '/bahan', { nama: 'Zzzbahan', satuan: 'g', kategori: 'bumbu' }, 'A')).data
  assert.equal((await panggil('POST', `/admin/bahan/${a.id}/setujui`, { nama: 'Daun jeruk purut', satuan: 'butir', sinonim: ['jeruk purut'] }, 'ADMIN')).status, 200)
  const row = (await db.query('SELECT nama, satuan, status FROM ingredients WHERE id=$1', [a.id])).rows[0]
  assert.deepEqual([row.nama, row.satuan, row.status], ['Daun jeruk purut', 'butir', 'baku'])
  assert.equal((await panggil('POST', `/admin/bahan/${b.id}/tolak`, null, 'ADMIN')).status, 200)
  assert.equal((await panggil('POST', `/admin/bahan/${b.id}/tolak`, null, 'ADMIN')).status, 404)
  assert.equal((await panggil('POST', `/admin/bahan/${a.id}/setujui`, null, 'A')).status, 403)
})

test('laporan: moderator menyembunyikan komentar dan menurunkan resep', async () => {
  const komentar = (await panggil('POST', `/resep/${id}/komentar`, { isi: 'komentar buruk' }, 'B')).data.id
  await panggil('POST', '/laporan', { comment_id: komentar, alasan: 'Spam' }, 'A')
  await panggil('POST', '/laporan', { recipe_id: id, alasan: 'Disalin dari sumber lain' }, 'B')
  const antre = (await panggil('GET', '/admin/antrean', null, 'ADMIN')).data.laporan
  assert.equal(antre.length, 2)
  const [lk, lr] = [antre.find((l) => l.comment_id), antre.find((l) => l.recipe_id)]
  assert.equal(lk.isi_komentar, 'komentar buruk')
  assert.equal((await panggil('POST', `/admin/laporan/${lk.id}/selesai`, { sembunyikan_komentar: true }, 'ADMIN')).status, 200)
  assert.equal((await db.query('SELECT disembunyikan FROM comments WHERE id=$1', [komentar])).rows[0].disembunyikan, true)
  assert.equal((await panggil('POST', `/admin/laporan/${lr.id}/selesai`, { turunkan_resep: true }, 'ADMIN')).status, 200)
  assert.equal((await db.query('SELECT status FROM recipes WHERE id=$1', [id])).rows[0].status, 'ditolak')
  assert.equal((await panggil('GET', '/admin/antrean', null, 'ADMIN')).data.laporan.length, 0)
})
