-- Skema MasakAda (spesifikasi bagian 11). Satuan hanya g, ml, butir.
CREATE TYPE satuan         AS ENUM ('g','ml','butir');
CREATE TYPE tempat_simpan  AS ENUM ('kulkas','freezer','suhu_ruang');
CREATE TYPE peran_bahan    AS ENUM ('utama','opsional','bumbu_dasar');
CREATE TYPE kesulitan      AS ENUM ('mudah','sedang','sulit');
CREATE TYPE level_pedas    AS ENUM ('tidak','sedang','pedas','sangat');
CREATE TYPE level_keahlian AS ENUM ('pemula','menengah','mahir');
CREATE TYPE status_resep   AS ENUM ('draf','ditinjau','terbit','ditolak');
CREATE TYPE fase_langkah   AS ENUM ('persiapan','memasak');

CREATE TABLE profiles (
  id              UUID PRIMARY KEY,               -- = auth.users.id
  nama            VARCHAR(100) NOT NULL,
  avatar_url      TEXT,
  role            VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  level_pedas     level_pedas NOT NULL DEFAULT 'sedang',
  level_keahlian  level_keahlian NOT NULL DEFAULT 'pemula',
  porsi_default   INT NOT NULL DEFAULT 1,
  tampilkan_kurang1 BOOLEAN NOT NULL DEFAULT TRUE,
  notif_tinjauan  BOOLEAN NOT NULL DEFAULT TRUE,
  paket           VARCHAR(10) NOT NULL DEFAULT 'gratis' CHECK (paket IN ('gratis','plus')),
  plus_sampai     TIMESTAMPTZ,
  poin            INT NOT NULL DEFAULT 0,
  setup_selesai   BOOLEAN NOT NULL DEFAULT FALSE,
  dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tools (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(50) UNIQUE NOT NULL,
  diasumsikan_ada BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE user_tools (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id INT  REFERENCES tools(id),
  punya   BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (user_id, tool_id)
);

CREATE TABLE ingredients (
  id          SERIAL PRIMARY KEY,
  nama        VARCHAR(100) UNIQUE NOT NULL,
  sinonim     TEXT[] NOT NULL DEFAULT '{}',
  kategori    VARCHAR(30) NOT NULL,
  satuan      satuan NOT NULL,
  bisa_pokok  BOOLEAN NOT NULL DEFAULT FALSE,
  pokok_default BOOLEAN NOT NULL DEFAULT FALSE,
  status      VARCHAR(12) NOT NULL DEFAULT 'baku' CHECK (status IN ('baku','menunggu','ditolak')),
  diajukan_oleh UUID REFERENCES profiles(id),
  kalori_per_100 NUMERIC(6,1)
);
CREATE INDEX ingredients_sinonim_idx ON ingredients USING gin (sinonim);

CREATE TABLE user_staples (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ingredient_id INT REFERENCES ingredients(id),
  PRIMARY KEY (user_id, ingredient_id)
);

CREATE TABLE pantry_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ingredient_id INT  NOT NULL REFERENCES ingredients(id),
  jumlah        NUMERIC(10,2) NOT NULL CHECK (jumlah >= 0),
  tempat        tempat_simpan NOT NULL DEFAULT 'kulkas',
  diubah_pada   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ingredient_id)
);

CREATE TABLE recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penulis_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  judul         VARCHAR(150) NOT NULL,
  deskripsi     TEXT,
  foto_url      TEXT,
  kategori      VARCHAR(30),
  porsi         INT NOT NULL DEFAULT 1 CHECK (porsi > 0),
  menit_persiapan INT CHECK (menit_persiapan BETWEEN 1 AND 240),
  menit_memasak   INT CHECK (menit_memasak  BETWEEN 1 AND 240),
  kesulitan     kesulitan NOT NULL DEFAULT 'mudah',
  level_pedas   level_pedas NOT NULL DEFAULT 'tidak',
  perlu_h_minus_1 BOOLEAN NOT NULL DEFAULT FALSE,
  eksklusif     BOOLEAN NOT NULL DEFAULT FALSE,
  status        status_resep NOT NULL DEFAULT 'draf',
  catatan_penolakan JSONB,
  ditinjau_pada TIMESTAMPTZ,
  terbit_pada   TIMESTAMPTZ,
  dibuat_pada   TIMESTAMPTZ NOT NULL DEFAULT now(),
  diubah_pada   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipe_tools (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  tool_id   INT  REFERENCES tools(id),
  catatan   VARCHAR(60),
  PRIMARY KEY (recipe_id, tool_id)
);

CREATE TABLE recipe_ingredients (
  recipe_id     UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INT  REFERENCES ingredients(id),
  jumlah        NUMERIC(10,2) NOT NULL CHECK (jumlah > 0),
  peran         peran_bahan NOT NULL DEFAULT 'utama',
  PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE TABLE recipe_steps (
  id          SERIAL PRIMARY KEY,
  recipe_id   UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  urutan      INT NOT NULL,
  fase        fase_langkah NOT NULL DEFAULT 'memasak',
  foto_url    TEXT,
  instruksi   TEXT NOT NULL,
  timer_menit INT,
  UNIQUE (recipe_id, urutan)
);
CREATE TABLE step_ingredients (
  step_id INT REFERENCES recipe_steps(id) ON DELETE CASCADE,
  ingredient_id INT REFERENCES ingredients(id),
  jumlah NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (step_id, ingredient_id)
);
CREATE TABLE step_tools (
  step_id INT REFERENCES recipe_steps(id) ON DELETE CASCADE,
  tool_id INT REFERENCES tools(id),
  PRIMARY KEY (step_id, tool_id)
);

CREATE TABLE cook_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id     UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  porsi         INT NOT NULL DEFAULT 1,
  pakai_pengganti BOOLEAN NOT NULL DEFAULT FALSE,
  bahan_terpakai INT NOT NULL DEFAULT 0,
  dimasak_pada  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE cook_history_items (
  cook_id UUID REFERENCES cook_history(id) ON DELETE CASCADE,
  ingredient_id INT REFERENCES ingredients(id),
  jumlah_dipakai NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (cook_id, ingredient_id)
);

CREATE TABLE ratings (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bintang   SMALLINT NOT NULL CHECK (bintang BETWEEN 1 AND 5),
  pakai_pengganti BOOLEAN,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (recipe_id, user_id)
);
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  isi        TEXT NOT NULL,
  foto_url   TEXT,
  disembunyikan BOOLEAN NOT NULL DEFAULT FALSE,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nama VARCHAR(60) NOT NULL
);
CREATE TABLE favorites (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  disimpan_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);
CREATE TABLE collection_items (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, recipe_id)
);

CREATE TABLE points_log (
  id SERIAL PRIMARY KEY,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  aksi      VARCHAR(30) NOT NULL,
  poin      INT NOT NULL,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  kode VARCHAR(40) UNIQUE NOT NULL,
  nama VARCHAR(60) NOT NULL,
  deskripsi TEXT NOT NULL,
  target INT,
  ikon_url TEXT
);
CREATE TABLE user_badges (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id INT REFERENCES badges(id),
  didapat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE ai_usage_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fitur   VARCHAR(12) NOT NULL CHECK (fitur IN ('chat','substitusi','scan','rencana')),
  token_masuk INT, token_keluar INT,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  peran VARCHAR(10) NOT NULL CHECK (peran IN ('user','assistant')),
  isi TEXT NOT NULL,
  resep_terkait UUID REFERENCES recipes(id),
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE meal_plans (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  minggu_mulai DATE NOT NULL,
  hari SMALLINT NOT NULL CHECK (hari BETWEEN 1 AND 7),
  waktu_makan VARCHAR(12) NOT NULL CHECK (waktu_makan IN ('siang','malam')),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL
);

CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul VARCHAR(120) NOT NULL, tema VARCHAR(60), deskripsi TEXT,
  pengisi VARCHAR(120), mulai TIMESTAMPTZ NOT NULL, durasi_menit INT DEFAULT 90,
  harga INT NOT NULL DEFAULT 0, kursi INT NOT NULL,
  tautan_zoom TEXT, tautan_rekaman TEXT
);
CREATE TABLE workshop_ingredients (
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  ingredient_id INT REFERENCES ingredients(id),
  jumlah NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (workshop_id, ingredient_id)
);
CREATE TABLE workshop_registrations (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  kode_tiket VARCHAR(12) NOT NULL,
  jenis_tiket VARCHAR(10) NOT NULL CHECK (jenis_tiket IN ('reguler','plus')),
  hadir BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, workshop_id)
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  pelapor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  alasan VARCHAR(40) NOT NULL, catatan TEXT,
  status VARCHAR(10) NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','selesai')),
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  jenis VARCHAR(30) NOT NULL,
  judul TEXT NOT NULL, isi TEXT, tautan TEXT,
  dibaca BOOLEAN NOT NULL DEFAULT FALSE,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE partner_stores (
  id SERIAL PRIMARY KEY, nama VARCHAR(40) NOT NULL, keterangan VARCHAR(80), tautan TEXT
);
