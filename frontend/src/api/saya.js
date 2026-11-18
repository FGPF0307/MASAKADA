import { api } from './client'

export const simpanAlat = (daftar) =>
  api('/saya/alat', { method: 'PUT', body: daftar.map((a) => ({ tool_id: a.id, punya: a.punya })) })

export const simpanBahanPokok = (daftar) =>
  api('/saya/bahan-pokok', { method: 'PUT', body: daftar.filter((b) => b.dipilih).map((b) => b.id) })

export const selesaikanSetup = () => api('/saya/setup-selesai', { method: 'POST' })
