-- 1. CRIAÇÃO DAS TABELAS
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
  embed_urls JSONB DEFAULT '[]'::jsonb,
  descriptors JSONB DEFAULT '[]'::jsonb,
  questions JSONB DEFAULT '[]'::jsonb,
  external_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started',
  score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, unit_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  session_date TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  question_index INTEGER,
  answer_value TEXT,
  is_done BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(unit_id, question_index)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. POLÍTICAS DE SEGURANÇA (Zerar e Recriar)
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total" ON units FOR ALL USING (auth.jwt() ->> 'email' IN ('willians.souza@escola.pr.gov.br'));

DROP POLICY IF EXISTS "Acesso Total" ON sessions;
CREATE POLICY "Acesso Total" ON sessions FOR ALL USING (auth.jwt() ->> 'email' IN ('willians.souza@escola.pr.gov.br'));

DROP POLICY IF EXISTS "Acesso Total" ON answers;
CREATE POLICY "Acesso Total" ON answers FOR ALL USING (auth.jwt() ->> 'email' IN ('willians.souza@escola.pr.gov.br'));

DROP POLICY IF EXISTS "Acesso Total" ON settings;
CREATE POLICY "Acesso Total" ON settings FOR ALL USING (auth.jwt() ->> 'email' IN ('willians.souza@escola.pr.gov.br'));

-- 3. INSERIR CONFIGURAÇÕES
INSERT INTO settings (key, value) VALUES 
('admin_pin', '1234'),
('med_pin', '5678'),
('med_name', 'Willians Antoniazzi'),
('med_phone', '5543999567378'),
('student_email', 'ione.ribeiro@escola.pr.gov.br'),
('start_date', '05/02/2026'),
('medical_period', '05/02/2026 a 19/12/2026'),
('cid_code', 'G71.2 / J96.1')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. INSERIR UNIDADES (Com tratamento de aspas e descritores)
INSERT INTO units (id, title, sub, color, sort_order, brief, plan_c, plan_h, plan_e, plan_a, wa, descriptors, external_links, questions) VALUES 
('u1', 'Unidade 1 — Palavras da cozinha', 'Kitchen words · Aulas 1001, 7, 8 · 10 min', 'teal', 0, 'Antes de começar: vá à cozinha com ela e segure objetos reais. Diga o nome em inglês devagar.', 'Vocabulário da cozinha', 'Identificar palavras em inglês', 'Objetos reais', 'Apontamento correto', 'Oi! Aula 1...', '["D3", "D5"]', '[]', '[{"q":"Mostra uma colher real?","type":"mc","opts":["SPOON — colher","FORK","KNIFE"],"hint":"Diga SPOON.","mediator":"Use objeto real."}]'),
('u2', 'Unidade 2 — Escuta e família', 'Listening · Aulas 1, 2 · 10 min', 'blue', 1, 'Fale devagar. Repita DUAS vezes.', 'Compreensão oral', 'Identificar palavra-chave', 'Mediadora lê frases', 'Identificação correta', 'Oi! Aula 2...', '["D1", "D4"]', '[]', '[{"q":"My MOTHER cooks every day?","type":"mc","opts":["Mãe","Avó","Irmã"],"hint":"MOTHER é a chave."}]'),
('u3', 'Unidade 3 — Meu nome, eu gosto', 'Self-introduction · Aulas 2, 9, 10 · 10 min', 'coral', 2, 'Apresentação pessoal.', 'Apresentação pessoal', 'Produzir frase simples', 'Modelagem', 'Produção oral', 'Oi! Aula 3...', '["D10"]', '[]', '[{"q":"MY NAME IS significa?","type":"mc","opts":["Meu nome é","Eu gosto"],"hint":"Conexão direta."}]'),
('u4', 'Unidade 4 — Inglês ao meu redor', 'English around us · Aulas 3, 4 · 10 min', 'purple', 3, 'Objetos reais.', 'Inglês no cotidiano', 'Reconhecer palavras', 'Objetos reais', 'Identificação', 'Oi! Aula 4...', '["D5"]', '[]', '[{"q":"O que significa RICE?","type":"mc","opts":["Arroz","Feijão"],"hint":"Aponte."}]'),
('u5', 'Unidade 5 — Inglês no celular', 'Digital English · Aulas 5, 6 · 10 min', 'pink', 4, 'Celular real.', 'Gêneros digitais', 'Vocabulário social', 'Navegação', 'Identificação', 'Oi! Aula 5...', '["D12"]', '[]', '[{"q":"O que é STORY?","type":"mc","opts":["Foto temporária","Mensagem"],"hint":"Ela já usa."}]'),
('u6', 'Unidade 6 — Minha receita em inglês', 'My recipe · Aulas 11–15 · 15 min', 'amber', 5, 'Ela é a professora.', 'Receita', 'Instrução', 'Inversão', 'Frase completa', 'Oi! Aula 6...', '["D9"]', '[]', '[{"q":"Qual o prato?","type":"text","hint":"Translate.","mediator":"Willians Antoniazzi"}]')
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  sub = EXCLUDED.sub,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  brief = EXCLUDED.brief,
  plan_c = EXCLUDED.plan_c,
  plan_h = EXCLUDED.plan_h,
  plan_e = EXCLUDED.plan_e,
  plan_a = EXCLUDED.plan_a,
  wa = EXCLUDED.wa,
  embed_urls = EXCLUDED.embed_urls,
  descriptors = EXCLUDED.descriptors,
  external_links = EXCLUDED.external_links,
  questions = EXCLUDED.questions;
