-- DIJAGNOSTIKA BADGE SISTEMA NA PRODUKCIJI
-- Pokrenite ovu skriptu direktno na PostgreSQL bazi

-- 1. Provjera da li badges tabela postoji
SELECT 'BADGES TABLE EXISTS: ' || EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'badges'
) AS badge_table_check;

-- 2. Provjera da li user_badges tabela postoji
SELECT 'USER_BADGES TABLE EXISTS: ' || EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_badges'
) AS user_badges_table_check;

-- 3. Ako badges postoji, pokaži strukturu
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'badges'
ORDER BY ordinal_position;

-- 4. Ako postoji, pokaži koliko redova ima
SELECT 'TOTAL BADGES: ' || COUNT(*) FROM badges;

-- 5. Lista svih tenanta
SELECT id, name FROM tenants;

-- 6. Provjeri foreign key constraints na badges
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'badges' AND tc.constraint_type = 'FOREIGN KEY';

-- 7. Test INSERT (zamijenite 'VAŠ-TENANT-ID' sa stvarnim ID-om)
-- INSERT INTO badges (id, tenant_id, name, description, criteria_type, criteria_value, icon)
-- VALUES (gen_random_uuid(), 'VAŠ-TENANT-ID', 'Test Badge', 'Test opis', 'points_total', 100, '🏅');
