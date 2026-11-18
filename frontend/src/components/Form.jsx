import Logo from './Logo'

export const Field = ({ label, ...props }) => (
  <label className="block">
    <span className="text-sm text-neutral-600">{label}</span>
    <input
      {...props}
      className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-sage"
    />
  </label>
)

const warna = {
  terakota: 'bg-terakota text-white',
  sage: 'bg-sage-gelap text-white',
  garis: 'bg-kartu border border-black/10 text-neutral-800',
}
export const Tombol = ({ variant = 'terakota', className = '', ...props }) => (
  <button
    {...props}
    className={`w-full rounded-xl py-3 font-medium disabled:opacity-60 ${warna[variant]} ${className}`}
  />
)

export const Pesan = ({ jenis = 'galat', children }) =>
  children ? (
    <p role="alert" className={`rounded-xl px-4 py-3 text-sm ${jenis === 'galat' ? 'bg-kurang text-terakota' : 'bg-siap text-sage-gelap'}`}>
      {children}
    </p>
  ) : null

// Bingkai halaman akun: logo di tengah, satu kolom.
export const HalamanAkun = ({ judul, isi, children }) => (
  <div className="min-h-screen flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-sm space-y-5">
      <div className="text-center"><Logo className="text-4xl" /></div>
      <div className="text-center space-y-1">
        <h1 className="font-judul text-2xl font-bold">{judul}</h1>
        {isi && <p className="text-sm text-neutral-600">{isi}</p>}
      </div>
      {children}
    </div>
  </div>
)
