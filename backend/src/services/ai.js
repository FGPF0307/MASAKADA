// Chef AI (spesifikasi bagian 10). Memakai Gemini Flash-Lite bila GEMINI_API_KEY ada dan AI_MOCK bukan "true";
// bila tidak (atau panggilan gagal) memakai jawaban berskrip supaya demo tetap jalan. Tidak mengirim data pribadi.
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'
export const modeMock = () => process.env.AI_MOCK === 'true' || !process.env.GEMINI_API_KEY

async function gemini({ sistem, bagian, json }) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sistem }] },
      contents: [{ role: 'user', parts: bagian }],
      generationConfig: json ? { responseMimeType: 'application/json', temperature: 0.2 } : { temperature: 0.6, maxOutputTokens: 500 },
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`) // isi galat tidak dicatat
  const j = await res.json()
  return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('')
}

// Coba AI sungguhan; jika mati/ditolak/keluaran rusak → mock. Mengembalikan { hasil, mock }.
async function jalankan(real, mock) {
  if (!modeMock()) {
    try { return { hasil: await real(), mock: false } } catch (e) { console.warn('Chef AI memakai mode skrip:', e.message) }
  }
  return { hasil: await mock(), mock: true }
}
const jsonDari = (teks) => JSON.parse(teks.replace(/^```(?:json)?|```$/gim, '').trim())

const SKRIP = [
  [/nasi/i, 'Nasi matang aman disimpan sekitar 4–6 jam di suhu ruang, atau 1–2 hari di kulkas dalam wadah tertutup. Panaskan sampai benar-benar panas sebelum dimakan.'],
  [/bayam|bekukan|beku|freezer/i, 'Bayam bisa dibekukan: rebus sebentar 1–2 menit, tiriskan, lalu simpan dalam wadah kedap udara. Tahan sekitar 2 bulan dan cocok untuk tumisan atau sup.'],
  [/telur/i, 'Telur mentah utuh tahan sekitar 3–4 minggu di kulkas. Tes sederhana: telur segar tenggelam di air, yang mengambang sebaiknya dibuang.'],
  [/ayam/i, 'Ayam mentah tahan 1–2 hari di kulkas dan sekitar 3 bulan di freezer. Cairkan di kulkas, bukan di suhu ruang, dan masak sampai matang sempurna.'],
  [/pengganti|ganti|substitusi/i, 'Untuk mencari pengganti bahan, buka resepnya lalu ketuk "Tanya Chef AI" pada bahan yang kurang. Aku akan mencocokkannya dengan isi pantrymu.'],
]
const SKRIP_UMUM = 'Aku Chef AI (mode demo). Coba tanya soal cara menyimpan bahan, pengganti bumbu, atau "bisa masak apa?" dari pantrymu.'

export const jawabChat = ({ pesan, pantry, alat, riwayat }) =>
  jalankan(
    async () => {
      const sistem = `Kamu Chef AI di aplikasi MasakAda. Jawab dalam Bahasa Indonesia, singkat (maks 120 kata), ramah, praktis. Hanya soal memasak dan bahan makanan. Tolak topik lain dengan sopan. Pantry pengguna: ${pantry.join(', ') || 'kosong'}. Alat: ${alat.join(', ') || 'standar'}.`
      const bagian = [{ text: [...riwayat.map((m) => `${m.peran === 'user' ? 'Pengguna' : 'Chef AI'}: ${m.isi}`), `Pengguna: ${pesan}`].join('\n') }]
      const teks = (await gemini({ sistem, bagian })).trim()
      if (!teks) throw new Error('kosong')
      return teks
    },
    async () => SKRIP.find(([re]) => re.test(pesan))?.[1] ?? SKRIP_UMUM,
  )

const UMUM = ['Kecap asin', 'Saus tiram', 'Saus tomat', 'Gula merah', 'Susu cair', 'Mentega', 'Minyak goreng', 'Telur', 'Tahu', 'Tempe', 'Ayam']

const rank = (n) => { const i = UMUM.indexOf(n); return i < 0 ? 99 : i }

// kandidat: [{id, nama, ada}] (bahan baku lain dengan satuan yang sama). Keluaran mentah: [{ingredient_id, jumlah, catatan}].
export const sarankanPengganti = ({ nama, butuh, satuan, kandidat }) =>
  jalankan(
    async () => {
      const sistem = `Kamu Chef AI MasakAda. Beri maksimal 2 pengganti untuk satu bahan resep. Aturan: hanya bahan umum di warung/minimarket/pasar Indonesia; hanya pilih dari daftar kandidat (pakai ingredient_id-nya); takaran pasti dalam ${satuan}; catatan rasa singkat (Bahasa Indonesia); utamakan kandidat dengan ada=true; jika tidak ada pengganti yang masuk akal, jawab []. Keluaran JSON: [{"ingredient_id":1,"jumlah":45,"catatan":"..."}]`
      const teks = `Bahan: ${nama}, butuh ${butuh} ${satuan}.\nKandidat: ${JSON.stringify(kandidat.map((k) => ({ ingredient_id: k.id, nama: k.nama, ada: k.ada })))}`
      return jsonDari(await gemini({ sistem, bagian: [{ text: teks }], json: true }))
    },
    async () =>
      [...kandidat]
        .sort((a, b) => b.ada - a.ada || rank(a.nama) - rank(b.nama))
        .slice(0, 2)
        .map((k) => ({ ingredient_id: k.id, jumlah: butuh, catatan: 'Rasa agak berbeda dari aslinya. Cicipi dulu dan sesuaikan.' })),
  )

// Daftar bahan baku {id, nama}; gambar: Buffer. Keluaran mentah: [{ingredient_id, jumlah, yakin}].
export const pindaiGambar = ({ gambar, tipe, bahan }) =>
  jalankan(
    async () => {
      const sistem = 'Kamu Chef AI MasakAda. Dari foto isi kulkas/rak, sebutkan bahan makanan yang terlihat. Hanya pilih dari daftar bahan baku (pakai ingredient_id). jumlah angka: gram (g), mililiter (ml), atau butir sesuai satuan bahan; yakin=false bila ragu. Keluaran JSON: [{"ingredient_id":1,"jumlah":6,"yakin":true}]'
      const bagian = [{ inline_data: { mime_type: tipe, data: gambar.toString('base64') } }, { text: `Daftar bahan baku: ${JSON.stringify(bahan.map((b) => ({ ingredient_id: b.id, nama: b.nama, satuan: b.satuan })))}` }]
      return jsonDari(await gemini({ sistem, bagian, json: true }))
    },
    async () => {
      const contoh = [['Telur', 6, true], ['Tomat', 3, true], ['Bayam', 150, true], ['Susu cair', 500, false]]
      return contoh.flatMap(([nama, jumlah, yakin]) => {
        const b = bahan.find((x) => x.nama === nama)
        return b ? [{ ingredient_id: b.id, jumlah, yakin }] : []
      })
    },
  )
