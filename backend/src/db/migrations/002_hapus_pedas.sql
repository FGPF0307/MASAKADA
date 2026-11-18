-- Fitur tingkat pedas dibatalkan: tidak ada filter pedas dan tidak ada pilihan pedas di resep.
ALTER TABLE profiles DROP COLUMN level_pedas;
ALTER TABLE recipes  DROP COLUMN level_pedas;
DROP TYPE level_pedas;
