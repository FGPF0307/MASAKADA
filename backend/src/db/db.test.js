import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { migrate } from './migrate.js'
import { seed } from './seed/seed.js'

test('migrasi + seed berjalan dan idempoten', async () => {
  const db = new PGlite()
  assert.equal((await migrate(db)).length, 2)
  assert.equal((await migrate(db)).length, 0)
  assert.equal(await seed(db), true)
  assert.equal(await seed(db), false)

  const n = async (sql) => (await db.query(sql)).rows[0].n
  assert.ok((await n('SELECT count(*)::int n FROM ingredients')) >= 100)
  assert.equal(await n('SELECT count(*)::int n FROM tools'), 11)
  assert.equal(await n("SELECT count(*)::int n FROM recipes WHERE status='terbit'"), 15)
  assert.equal(await n('SELECT count(*)::int n FROM badges'), 6)
  assert.equal(await n('SELECT count(*)::int n FROM partner_stores'), 4)
  assert.equal(await n('SELECT count(*)::int n FROM workshops'), 4)
  // bahan pokok default
  assert.equal(await n('SELECT count(*)::int n FROM ingredients WHERE pokok_default'), 3)
  // resep utama: 7 bahan, 4 langkah, timer 20 mnt di langkah 2
  const utama = "(SELECT id FROM recipes WHERE judul='Ayam Kecap Rice Cooker')"
  assert.equal(await n(`SELECT count(*)::int n FROM recipe_ingredients WHERE recipe_id=${utama}`), 7)
  assert.equal(await n(`SELECT count(*)::int n FROM recipe_steps WHERE recipe_id=${utama} AND timer_menit=20 AND urutan=2`), 1)
  // tidak ada kata takaran tidak pasti di langkah mana pun
  assert.equal(await n("SELECT count(*)::int n FROM recipe_steps WHERE instruksi ~* 'secukupnya|sejumput|sesuai selera|seperlunya'"), 0)
  await db.close()
})
