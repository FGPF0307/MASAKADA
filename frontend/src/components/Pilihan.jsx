export const Chip = ({ aktif, className = '', ...props }) => (
  <button
    type="button"
    aria-pressed={aktif}
    {...props}
    className={`rounded-full border px-4 py-2 text-sm disabled:opacity-80 ${
      aktif ? 'bg-sage-gelap border-sage-gelap text-white' : 'bg-kartu border-black/10 text-neutral-800'
    } ${className}`}
  />
)

// Pilihan tunggal. opsi: [[nilai, label]]
export const Segmented = ({ nilai, opsi, onChange }) => (
  <div role="radiogroup" className="flex flex-wrap gap-2">
    {opsi.map(([v, label]) => (
      <Chip key={v} role="radio" aria-checked={v === nilai} aktif={v === nilai} onClick={() => onChange(v)}>
        {label}
      </Chip>
    ))}
  </div>
)

export const Sakelar = ({ label, nilai, onChange }) => (
  <label className="flex items-center justify-between gap-4 py-2">
    <span>{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={nilai}
      onClick={() => onChange(!nilai)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${nilai ? 'bg-sage-gelap' : 'bg-black/20'}`}
    >
      <span className={`absolute top-0.5 size-6 rounded-full bg-white transition-all ${nilai ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </label>
)

export const StepperKecil = ({ nilai, min = 1, max = 20, onChange }) => (
  <div className="inline-flex items-center gap-4 rounded-xl bg-kartu border border-black/10 px-2 py-1">
    <button type="button" aria-label="Kurangi" disabled={nilai <= min} onClick={() => onChange(nilai - 1)} className="size-8 text-xl disabled:opacity-30">−</button>
    <span className="w-6 text-center font-medium">{nilai}</span>
    <button type="button" aria-label="Tambah" disabled={nilai >= max} onClick={() => onChange(nilai + 1)} className="size-8 text-xl disabled:opacity-30">+</button>
  </div>
)
