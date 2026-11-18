import { createRemoteJWKSet, jwtVerify } from 'jose'

const galat = (pesan) => Object.assign(new Error(pesan), { status: 401 })

// Verifikasi JWT Supabase (kunci asimetris, lewat JWKS). user_id selalu dari token, bukan dari body request.
export function buatAuth(jwks, issuer) {
  return async (req, _res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer /, '')
    if (!token) return next(galat('Kamu perlu masuk dulu.'))
    try {
      const { payload: p } = await jwtVerify(token, jwks, { issuer, audience: 'authenticated' })
      const nama = p.user_metadata?.nama ?? p.user_metadata?.full_name ?? p.email?.split('@')[0] ?? 'Pengguna'
      req.user = { id: p.sub, email: p.email, nama }
      next()
    } catch {
      next(galat('Sesi tidak valid. Silakan masuk lagi.'))
    }
  }
}

let jwks
export const auth = (req, res, next) => {
  const base = `${process.env.SUPABASE_URL}/auth/v1`
  jwks ??= createRemoteJWKSet(new URL(`${base}/.well-known/jwks.json`))
  return buatAuth(jwks, base)(req, res, next)
}
