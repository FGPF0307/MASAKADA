// Kartu pastel dengan 2 huruf pertama nama bahan (mis. "Ay" untuk Ayam).
const PASTEL = ['bg-kurang', 'bg-siap', 'bg-emas/70', 'bg-sage/35']
const warna = (nama) => PASTEL[[...nama].reduce((a, c) => a + c.charCodeAt(0), 0) % PASTEL.length]

export default function AvatarBahan({ nama, className = 'size-12' }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-2xl font-semibold text-neutral-700 ${warna(nama)} ${className}`} aria-hidden>
      {nama.slice(0, 2)}
    </span>
  )
}
