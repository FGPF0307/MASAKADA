import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { buatApp } from '../app.js'
import { migrate } from '../db/migrate.js'
import { resep } from '../db/seed/data.js'
import { seed } from '../db/seed/seed.js'

// Auth palsu yang menolak permintaan tanpa token, seperti auth asli.
const db = new PGlite()
await migrate(db)
await seed(db)
const authMw = (req, res, next) => (req.headers.authorization ? ((req.user = { id: '33333333-3333-4333-8333-333333333333', nama: 'X' }), next()) : res.status(401).json({ pesan: 'Kamu perlu masuk dulu.' }))
const server = buatApp({ db, authMw }).listen(0)
const base = `http://localhost:${server.address().port}/api`
test.after(() => { server.close(); return db.close() })

test('tamu: daftar resep publik tanpa login, detail & pantry tetap wajib login', async () => {
  const semua = await (await fetch(`${base}/publik/resep`)).json()
  assert.equal(semua.length, resep.length)
  assert.ok(semua.every((r) => r.id && r.judul && r.chip_waktu && !('bahan_kurang' in r)))
  const rc = await (await fetch(`${base}/publik/resep?kategori=Rice%20cooker`)).json()
  assert.ok(rc.length > 0 && rc.every((r) => r.kategori === 'Rice cooker'))
  const ringkas = await (await fetch(`${base}/publik/resep/${semua[0].id}`)).json()
  assert.equal(ringkas.judul, semua[0].judul)
  assert.ok(ringkas.bahan.length === ringkas.jumlah_bahan && ringkas.langkah.length === ringkas.jumlah_langkah)
  assert.equal((await fetch(`${base}/publik/resep/bukan-id`)).status, 404)
  assert.equal((await fetch(`${base}/resep/${semua[0].id}`)).status, 401)
  assert.equal((await fetch(`${base}/pantry`)).status, 401)
  assert.equal((await fetch(`${base}/resep/cocok`)).status, 401)
})

test('daftar tanpa konfirmasi email: validasi input dan email ganda', async () => {
  const dibuat = []
  const palsu = async (akun) => {
    if (dibuat.some((a) => a.email === akun.email)) throw Object.assign(new Error('Email ini sudah terdaftar. Silakan masuk.'), { status: 409 })
    dibuat.push(akun)
  }
  const srv = buatApp({ db, authMw, buatAkun: palsu }).listen(0)
  const kirim = (body) => fetch(`http://localhost:${srv.address().port}/api/publik/daftar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  try {
    assert.equal((await kirim({ nama: 'Rani', email: 'Rani@Contoh.id', sandi: 'rahasia123' })).status, 201)
    assert.deepEqual(dibuat[0], { nama: 'Rani', email: 'rani@contoh.id', sandi: 'rahasia123' })
    assert.equal((await kirim({ nama: 'Rani', email: 'rani@contoh.id', sandi: 'rahasia123' })).status, 409)
    assert.equal((await kirim({ nama: '', email: 'a@b.id', sandi: 'rahasia123' })).status, 400)
    assert.equal((await kirim({ nama: 'A', email: 'bukan-email', sandi: 'rahasia123' })).status, 400)
    assert.equal((await kirim({ nama: 'A', email: 'a@b.id', sandi: 'pendek' })).status, 400)
  } finally {
    srv.close()
  }
})
