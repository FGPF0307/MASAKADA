// Tabel kalori (perkiraan kasar) per 100 g / 100 ml. Untuk bahan satuan "butir": kalori per 100 butir,
// supaya rumus jumlah / 100 × nilai sama untuk semua satuan. Nutrisi di MasakAda dihitung dari tabel ini, bukan AI.
const TABEL = `
Ayam 165|Telur 7000|Tahu 3000|Tempe 193|Daging sapi 250|Ikan 120|Udang 99|Sosis 10000|Bakso 4000|Ikan teri 250|Telur puyuh 1400|Oncom 187|Hati ayam 167
Wortel 3000|Bayam 23|Kangkung 19|Kol 25|Sawi 13|Brokoli 34|Kentang 11000|Tomat 2000|Timun 2500|Terong 3500|Buncis 31|Kacang panjang 31|Labu siam 4000|Jagung 96|Kembang kol 25|Pare 2500|Jamur 22|Daun bawang 32|Seledri 16
Cabai rawit 100|Cabai merah 500|Bawang bombai 4500|Kemangi 23|Jahe 80|Lengkuas 71|Kunyit 70|Serai 500|Daun salam 100|Jeruk nipis 1000|Tauge 30|Kacang tanah 567|Pisang 9000|Singkong 160|Ubi jalar 86|Labu kuning 26
Nasi 130|Mi instan 38000|Mi telur 350|Bihun 360|Spaghetti 360|Makaroni 360|Roti tawar 8000|Tepung terigu 364|Tepung beras 360|Tepung maizena 381|Tepung tapioka 358|Oat 389|Soun 350
Kecap manis 250|Kecap asin 60|Saus tiram 50|Saus sambal 80|Saus tomat 100|Mayones 680|Terasi 150|Cuka 20|Minyak wijen 884|Santan 200
Susu cair 60|Susu kental manis 330|Keju 400|Keju krim 340|Krim kental 340|Mentega 717|Yogurt 60
Air 0|Garam 0|Minyak goreng 884|Gula pasir 387|Gula merah 375|Merica bubuk 251|Bawang putih 149|Bawang merah 40|Kaldu bubuk 230|Ketumbar 298|Kemiri 628|Pala 525|Kayu manis 247|Cengkeh 274|Jintan 375|Bubuk cabai 282|Kari bubuk 325|Baking powder 53|Soda kue 0|Ragi 325|Madu 304|Asam jawa 239|Sirup 260|Cokelat bubuk 228|Kopi 2|Teh 1
`.trim().split(/\n|\|/).map((s) => s.trim()).filter(Boolean).map((s) => [s.slice(0, s.lastIndexOf(' ')), Number(s.slice(s.lastIndexOf(' ') + 1))])

// Aman dijalankan berulang: hanya mengisi bahan yang kalorinya belum ada.
export async function isiKalori(db) {
  for (const [nama, k] of TABEL) await db.query('UPDATE ingredients SET kalori_per_100=$2 WHERE nama=$1 AND kalori_per_100 IS NULL', [nama, k])
}
