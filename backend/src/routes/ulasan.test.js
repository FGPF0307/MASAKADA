import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { buatApp } from '../app.js'
import { migrate } from '../db/migrate.js'
import { seed, SINTA_ID } from '../db/seed/seed.js'

process.env.SUPABASE_URL = 'https://x.test' // jangan bergantung pada .env asli
const FOTO = 'https://x.test/storage/v1/object/public/foto'

const PENGGUNA = {
  A: { id: '44444444-4444-4444-8444-444444444444', nama: 'Nazlan' },
  B: { id: '55555555-5555-4555-8555-555555555555', nama: 'Rani' },
  SINTA: { id: SINTA_ID, nama: 'Sinta' },
}
const db = new PGlite()
await migrate(db)
await seed(db)
const server = buatApp({
  db,
  authMw: (req, _res, next) => ((req.user = PENGGUNA[req.headers['x-user'] ?? 'A']), next()),
  storage: async (_buf, _tipe, uid) => `${FOTO}/${uid}/abc.jpg`,
}).listen(0)
const base = `http://localhost:${server.address().port}/api`
test.after(() => { server.close(); return db.close() })

const panggil = async (metode, path, body, user = 'A') => {
  const res = await fetch(base + path, { method: metode, headers: { 'Content-Type': 'application/json', 'x-user': user }, body: body && JSON.stringify(body) })
  return { status: res.status, data: await res.json().catch(() => null) }
}
const resepId = async (judul) => (await db.query('SELECT id FROM recipes WHERE judul=$1', [judul])).rows[0].id
await panggil('GET', '/saya', null, 'A')
await panggil('GET', '/saya', null, 'B')
const R = await resepId('Telur Dadar Tahu')
const masak = (user) => panggil('POST', `/resep/${R}/selesai`, { lewati: true }, user)

test('bintang: hanya setelah memasak dan bukan resep sendiri; bisa diubah', async () => {
  assert.equal((await panggil('PUT', `/resep/${R}/rating`, { bintang: 5 }, 'A')).status, 403) // belum memasak
  assert.equal((await panggil('PUT', `/resep/${R}/rating`, { bintang: 5 }, 'SINTA')).status, 403) // resep sendiri
  await masak('A')
  assert.equal((await panggil('PUT', `/resep/${R}/rating`, { bintang: 5, pakai_pengganti: false }, 'A')).status, 200)
  assert.equal((await panggil('PUT', `/resep/${R}/rating`, { bintang: 4 }, 'A')).data.bintang, 4) // diganti, bukan ditambah
  assert.equal((await panggil('PUT', `/resep/${R}/rating`, { bintang: 6 }, 'A')).status, 400)
  assert.equal((await panggil('PUT', `/resep/${R}/rating`, { bintang: 3, pakai_pengganti: 'ya' }, 'A')).status, 400)
  assert.equal((await db.query('SELECT count(*)::int n FROM ratings')).rows[0].n, 1)
})

test('komentar terbuka untuk semua pengguna; validasi isi dan foto', async () => {
  assert.equal((await panggil('POST', `/resep/${R}/komentar`, { isi: 'Enak, anak kos banget!' }, 'B')).status, 201) // B belum memasak
  assert.equal((await panggil('POST', `/resep/${R}/komentar`, { isi: 'Mantap', foto_url: `${FOTO}/a.jpg` }, 'A')).status, 201)
  assert.equal((await panggil('POST', `/resep/${R}/komentar`, { isi: 'hai', foto_url: 'https://evil.test/a.jpg' }, 'B')).status, 400) // bukan bucket kita
  assert.equal((await panggil('POST', `/resep/${R}/komentar`, { isi: '   ' }, 'B')).status, 400)
  assert.equal((await panggil('POST', `/resep/${R}/komentar`, { isi: 'x'.repeat(1001) }, 'B')).status, 400)
  assert.equal((await panggil('POST', `/resep/${R}/komentar`, { isi: 'hai', foto_url: 'javascript:alert(1)' }, 'B')).status, 400)
  assert.equal((await panggil('POST', '/resep/00000000-0000-4000-8000-000000000000/komentar', { isi: 'hai' }, 'B')).status, 404)
})

test('ulasan: rata-rata, sebaran, hak menilai, komentar menyertakan bintang penulisnya', async () => {
  await masak('B')
  await panggil('PUT', `/resep/${R}/rating`, { bintang: 5, pakai_pengganti: true }, 'B')
  const a = (await panggil('GET', `/resep/${R}/ulasan`, null, 'A')).data
  assert.deepEqual([a.rata, a.jumlah], [4.5, 2])
  assert.deepEqual(a.distribusi, { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 })
  assert.deepEqual(a.penilaian_saya, { bintang: 4, pakai_pengganti: null })
  assert.equal(a.boleh_menilai, true)
  const komentarA = a.ulasan.find((u) => u.isi === 'Mantap')
  assert.deepEqual([komentarA.nama, komentarA.bintang, komentarA.milik_saya, komentarA.foto_url], ['Nazlan', 4, true, `${FOTO}/a.jpg`])
  const dariB = a.ulasan.find((u) => u.nama === 'Rani')
  assert.deepEqual([dariB.bintang, dariB.pakai_pengganti, dariB.milik_saya], [5, true, false])
  assert.equal((await panggil('GET', `/resep/${R}/ulasan`, null, 'SINTA')).data.boleh_menilai, false)
  assert.equal((await panggil('GET', `/resep/${R}/ulasan?batas=1`, null, 'A')).data.ulasan.length, 1)

  await db.query("UPDATE comments SET disembunyikan = true WHERE isi = 'Mantap'")
  assert.ok(!(await panggil('GET', `/resep/${R}/ulasan`, null, 'A')).data.ulasan.some((u) => u.isi === 'Mantap'))
})

test('laporan resep/komentar divalidasi dan tersimpan', async () => {
  const komentar = (await db.query("SELECT id FROM comments WHERE isi LIKE 'Enak%'")).rows[0].id
  assert.equal((await panggil('POST', '/laporan', { recipe_id: R, alasan: 'Spam' }, 'B')).status, 201)
  assert.equal((await panggil('POST', '/laporan', { comment_id: komentar, alasan: 'Lainnya', catatan: 'tidak sopan' }, 'A')).status, 201)
  assert.equal((await db.query('SELECT count(*)::int n FROM reports')).rows[0].n, 2)
  assert.equal((await panggil('POST', '/laporan', { recipe_id: R, alasan: 'Bosan' }, 'B')).status, 400)
  assert.equal((await panggil('POST', '/laporan', { recipe_id: R, comment_id: komentar, alasan: 'Spam' }, 'B')).status, 400)
  assert.equal((await panggil('POST', '/laporan', { alasan: 'Spam' }, 'B')).status, 400)
  assert.equal((await panggil('POST', '/laporan', { comment_id: '00000000-0000-4000-8000-000000000000', alasan: 'Spam' }, 'B')).status, 404)
})

test('unggah foto: hanya gambar sungguhan, maks 2 MB', async () => {
  const kirim = (isi, tipe) => fetch(`${base}/unggah-foto`, { method: 'POST', headers: { 'Content-Type': tipe, 'x-user': 'A' }, body: isi })
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])
  const ok = await kirim(jpeg, 'image/jpeg')
  assert.equal(ok.status, 201)
  assert.ok((await ok.json()).url.startsWith(FOTO))
  assert.equal((await kirim(jpeg, 'text/plain')).status, 415) // tipe bukan gambar
  assert.equal((await kirim(Buffer.from('bukan gambar'), 'image/jpeg')).status, 415) // isi bukan JPEG
  assert.equal((await kirim(Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2]), 'image/jpeg')).status, 415) // PNG menyamar JPEG
  const besar = await kirim(Buffer.concat([jpeg, Buffer.alloc(2 * 1024 * 1024)]), 'image/jpeg')
  assert.equal(besar.status, 413)
  assert.match((await besar.json()).pesan, /terlalu besar/)
})
