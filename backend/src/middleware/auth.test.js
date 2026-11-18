import assert from 'node:assert/strict'
import test from 'node:test'
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose'
import { buatAuth } from './auth.js'

const ISS = 'https://x.supabase.co/auth/v1'
const { publicKey, privateKey } = await generateKeyPair('ES256')
const jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), alg: 'ES256', kid: 'k1' }] })
const auth = buatAuth(jwks, ISS)

const jalankan = (token) =>
  new Promise((resolve) => {
    const req = { headers: token ? { authorization: `Bearer ${token}` } : {} }
    auth(req, {}, (err) => resolve({ err, req }))
  })
const buat = (opsi = {}) =>
  new SignJWT({ email: 'nazlan@x.id', user_metadata: { nama: 'Nazlan' } })
    .setProtectedHeader({ alg: 'ES256', kid: 'k1' })
    .setSubject('u-1').setIssuer(opsi.iss ?? ISS).setAudience('authenticated')
    .setExpirationTime(opsi.exp ?? '1h').sign(opsi.kunci ?? privateKey)

test('token valid → req.user terisi', async () => {
  const { err, req } = await jalankan(await buat())
  assert.equal(err, undefined)
  assert.deepEqual(req.user, { id: 'u-1', email: 'nazlan@x.id', nama: 'Nazlan' })
})

test('tanpa token, token kedaluwarsa, issuer salah, kunci salah → 401', async () => {
  const lain = await generateKeyPair('ES256')
  for (const token of [null, await buat({ exp: '-1h' }), await buat({ iss: 'https://lain/auth/v1' }), await buat({ kunci: lain.privateKey })]) {
    assert.equal((await jalankan(token)).err.status, 401)
  }
})
