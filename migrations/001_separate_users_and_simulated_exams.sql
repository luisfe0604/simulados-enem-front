-- =====================================================================
-- Migration: separar tabelas compartilhadas (users, simulated_exams)
-- entre o sistema OAB e o sistema ENEM.
--
-- O QUE ESTE SCRIPT FAZ:
--   1. Cria `public.users_enem`            (clone estrutural de `users`)
--   2. Copia TODAS as linhas de `users` para `users_enem`, preservando
--      os IDs originais (para não invalidar sessões/logins existentes).
--   3. Cria `public.simulated_exams_enem`  (clone estrutural de `simulated_exams`)
--   4. Copia só as linhas de `simulated_exams` que já são identificáveis
--      como ENEM (via join com `simulated_exam_questions_enem`).
--   5. Repondera a FK de `simulated_exam_questions_enem.simulated_exam_id`
--      para apontar para `simulated_exams_enem` (essa tabela é exclusiva
--      do ENEM, pode ser alterada com segurança).
--   6. Adiciona FK de `simulated_exams_enem.user_id` -> `users_enem.id`.
--
-- O QUE ESTE SCRIPT *NÃO* FAZ (garantias):
--   - NÃO altera, renomeia nem remove nenhuma coluna de `users` ou
--     `simulated_exams`.
--   - NÃO apaga nenhuma linha das tabelas originais.
--   - NÃO mexe em nenhuma tabela exclusiva da OAB (`exams`, `questions`,
--     `question_subjects`, `subjects`, `simulated_exam_questions`).
--   - Roda inteiro dentro de uma transação: se qualquer passo falhar,
--     tudo é desfeito (ROLLBACK automático) e nada fica pela metade.
--
-- PRÉ-REQUISITO: rodar isso UMA VEZ só. Se `users_enem` ou
-- `simulated_exams_enem` já existirem, o CREATE TABLE vai falhar de
-- propósito (não usamos IF NOT EXISTS) para não duplicar dados.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) users_enem: clone estrutural de users (colunas, defaults, unique,
--    índices, PK — LIKE nunca copia foreign keys, então fica seguro).
-- ---------------------------------------------------------------------
CREATE TABLE public.users_enem (LIKE public.users INCLUDING ALL);

-- O LIKE copia o DEFAULT da coluna id apontando pra sequence ORIGINAL
-- (users_id_seq). Isso não pode continuar assim — desacoplamos criando
-- uma sequence própria para users_enem.
ALTER TABLE public.users_enem ALTER COLUMN id DROP DEFAULT;
CREATE SEQUENCE public.users_enem_id_seq OWNED BY public.users_enem.id;
ALTER TABLE public.users_enem ALTER COLUMN id SET DEFAULT nextval('public.users_enem_id_seq');

-- Clona TODAS as linhas, preservando os IDs originais. Isso é
-- intencional: qualquer usuário que hoje consegue logar no ENEM
-- continua conseguindo logar (mesmo email/senha), sem quebrar nada.
-- A partir daqui, as duas tabelas evoluem de forma independente.
INSERT INTO public.users_enem SELECT * FROM public.users;

-- Ajusta a sequence pra continuar a partir do maior id copiado.
SELECT setval('public.users_enem_id_seq', COALESCE((SELECT MAX(id) FROM public.users_enem), 0) + 1, false);

-- ---------------------------------------------------------------------
-- 2) simulated_exams_enem: clone estrutural de simulated_exams.
-- ---------------------------------------------------------------------
CREATE TABLE public.simulated_exams_enem (LIKE public.simulated_exams INCLUDING ALL);

ALTER TABLE public.simulated_exams_enem ALTER COLUMN id DROP DEFAULT;
CREATE SEQUENCE public.simulated_exams_enem_id_seq OWNED BY public.simulated_exams_enem.id;
ALTER TABLE public.simulated_exams_enem ALTER COLUMN id SET DEFAULT nextval('public.simulated_exams_enem_id_seq');

-- Copia só as linhas que já são inequivocamente do ENEM: aquelas que
-- têm pelo menos um detalhe em simulated_exam_questions_enem.
INSERT INTO public.simulated_exams_enem
SELECT DISTINCT se.*
  FROM public.simulated_exams se
  JOIN public.simulated_exam_questions_enem seq ON seq.simulated_exam_id = se.id;

SELECT setval('public.simulated_exams_enem_id_seq', COALESCE((SELECT MAX(id) FROM public.simulated_exams_enem), 0) + 1, false);

-- FK nova (tabela nova, sem risco): simulated_exams_enem.user_id -> users_enem.id
ALTER TABLE public.simulated_exams_enem
  ADD CONSTRAINT fk_simulated_exams_enem_user
  FOREIGN KEY (user_id) REFERENCES public.users_enem(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------
-- 3) Repontear a FK de simulated_exam_questions_enem para a nova tabela.
--    Essa tabela é exclusiva do ENEM (confirmado: OAB nunca a referencia),
--    então alterá-la é seguro. Usamos busca dinâmica do nome da
--    constraint para não depender de um nome fixo.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  cname text;
BEGIN
  SELECT tc.constraint_name INTO cname
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
   WHERE tc.table_schema = 'public'
     AND tc.table_name = 'simulated_exam_questions_enem'
     AND tc.constraint_type = 'FOREIGN KEY'
     AND kcu.column_name = 'simulated_exam_id';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.simulated_exam_questions_enem DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.simulated_exam_questions_enem
  ADD CONSTRAINT fk_seq_enem_simulated_exam_enem
  FOREIGN KEY (simulated_exam_id) REFERENCES public.simulated_exams_enem(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------
-- 4) Checagens de sanidade — se alguma destas contagens não bater,
--    o COMMIT abaixo ainda não rodou: revise antes de confirmar.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  users_count int;
  users_enem_count int;
  sim_enem_count int;
  sim_enem_distinct int;
BEGIN
  SELECT COUNT(*) INTO users_count FROM public.users;
  SELECT COUNT(*) INTO users_enem_count FROM public.users_enem;
  SELECT COUNT(*) INTO sim_enem_count FROM public.simulated_exams_enem;
  SELECT COUNT(DISTINCT simulated_exam_id) INTO sim_enem_distinct FROM public.simulated_exam_questions_enem;

  IF users_count <> users_enem_count THEN
    RAISE EXCEPTION 'users (%) != users_enem (%)', users_count, users_enem_count;
  END IF;

  IF sim_enem_count <> sim_enem_distinct THEN
    RAISE EXCEPTION 'simulated_exams_enem (%) != distinct simulated_exam_id em simulated_exam_questions_enem (%)', sim_enem_count, sim_enem_distinct;
  END IF;

  RAISE NOTICE 'OK: users_enem = % linhas, simulated_exams_enem = % linhas', users_enem_count, sim_enem_count;
END $$;

COMMIT;

-- =====================================================================
-- Depois de rodar (com sucesso), rode estas queries manualmente para
-- conferir visualmente:
--
--   SELECT COUNT(*) FROM public.users;              -- deve ser IGUAL a:
--   SELECT COUNT(*) FROM public.users_enem;
--
--   SELECT COUNT(*) FROM public.simulated_exams_enem;
--   SELECT COUNT(DISTINCT simulated_exam_id) FROM public.simulated_exam_questions_enem;
--
--   -- Confirma que as tabelas da OAB continuam intactas e sem nenhuma
--   -- FK nova apontando pra elas:
--   SELECT COUNT(*) FROM public.users;
--   SELECT COUNT(*) FROM public.simulated_exams;
-- =====================================================================
