-- 1. Tabela de Perfis (Profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  stars INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Unidades (Units)
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sub TEXT,
  color TEXT,
  sort_order INTEGER,
  brief TEXT,
  plan_c TEXT,
  plan_h TEXT,
  plan_e TEXT,
  plan_a TEXT,
  wa TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  external_links JSONB DEFAULT '[]'::jsonb,
  embed_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Progresso do Aluno (Student Progress)
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started', -- 'locked', 'not_started', 'completed'
  score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, unit_id)
);

-- 4. Tabela de Sessões (Sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  session_date TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Respostas (Answers)
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  question_index INTEGER,
  answer_value TEXT,
  is_done BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, unit_id, question_index)
);

-- 6. Tabela de Configurações (Settings)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para adicionar recompensas e atualizar nível
CREATE OR REPLACE FUNCTION add_student_rewards(xp_to_add INTEGER, stars_to_add INTEGER)
RETURNS JSONB AS $$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
  new_stars INTEGER;
BEGIN
  UPDATE profiles
  SET 
    xp = xp + xp_to_add,
    stars = stars + stars_to_add,
    updated_at = NOW()
  WHERE id = auth.uid()
  RETURNING xp, stars INTO new_xp, new_stars;

  -- Lógica simples de nível: 100 XP por nível
  new_level := (new_xp / 100) + 1;

  UPDATE profiles
  SET level = new_level
  WHERE id = auth.uid();

  RETURN jsonb_build_object('xp', new_xp, 'level', new_level, 'stars', new_stars);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE units, sessions, answers, settings, profiles, student_progress;

-- Inserir Configurações Iniciais
INSERT INTO settings (key, value) VALUES 
('admin_pin', '1234'),
('med_pin', '5678'),
('med_name', 'Willians Antoniazzi'),
('med_phone', '5543999567378'),
('student_email', 'ione.ribeiro@escola.pr.gov.br')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
