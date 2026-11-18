import 'dotenv/config'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { seed } from './seed/seed.js'

const dir = fileURLToPath(new URL('./migrations/', import.meta.url))
// pg.Pool memakai query() untuk multi-statement tanpa parameter; PGlite memakai exec().
const run = (db, sql) => (db.exec ? db.exec(sql) : db.query(sql))

export async function migrate(db) {
  await run(db, 'CREATE TABLE IF NOT EXISTS schema_migrations (nama TEXT PRIMARY KEY)')
  const sudah = new Set((await db.query('SELECT nama FROM schema_migrations')).rows.map((r) => r.nama))
  const baru = []
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (sudah.has(f)) continue
    await run(db, readFileSync(dir + f, 'utf8'))
    await db.query('INSERT INTO schema_migrations VALUES ($1)', [f])
    baru.push(f)
  }
  return baru
}

if (process.argv[1]?.endsWith('migrate.js')) {
  const { pool } = await import('./pool.js')
  try {
    console.log('Migrasi baru:', (await migrate(pool)).join(', ') || '(tidak ada)')
    if (process.argv.includes('--seed')) console.log((await seed(pool)) ? 'Seed selesai.' : 'Seed dilewati (data sudah ada).')
  } finally {
    await pool.end()
  }
}
