-- ============================================================
-- AXIS 360 — Schema Supabase
-- ============================================================

-- Extensão para UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- PRODUTOS E METODOLOGIAS
-- ============================================================
create table products (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique, -- 'gps' | 'pae_starter' | 'pae_scale'
  description text,
  methodology text,                 -- texto livre da metodologia
  stages      jsonb default '[]',   -- [{ "order": 1, "title": "...", "description": "..." }]
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- CLIENTES
-- ============================================================
create table clients (
  id             uuid primary key default uuid_generate_v4(),
  business_name  text not null,
  owner_name     text not null,
  email          text,
  phone          text,
  segment        text,              -- 'clinica_estetica' | 'outro'
  product_id     uuid references products(id),
  status         text not null default 'active', -- 'active' | 'paused' | 'churned'
  start_date     date,
  end_date       date,
  sheets_url     text,              -- link da planilha PGM do cliente
  user_id        uuid references auth.users(id), -- acesso ao portal
  notes          text,              -- observações internas
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- DIAGNÓSTICO INICIAL
-- ============================================================
create table diagnostics (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references clients(id) on delete cascade,
  answers     jsonb not null default '{}', -- respostas estruturadas por área
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- UPLOADS (GBP Check, prints WhatsApp, docs)
-- ============================================================
create table client_uploads (
  id           uuid primary key default uuid_generate_v4(),
  client_id    uuid not null references clients(id) on delete cascade,
  type         text not null, -- 'gbp_check' | 'whatsapp' | 'site' | 'outro'
  label        text,
  file_url     text not null, -- Supabase Storage URL
  file_name    text,
  uploaded_by  uuid references auth.users(id),
  uploaded_at  timestamptz not null default now()
);

-- ============================================================
-- MÉTRICAS MENSAIS (vindas da PGM / Google Sheets)
-- ============================================================
create table metrics_monthly (
  id                  uuid primary key default uuid_generate_v4(),
  client_id           uuid not null references clients(id) on delete cascade,
  month               integer not null check (month between 1 and 12),
  year                integer not null,
  -- Faturamento
  fat_total           numeric(12,2),
  fat_protocolos      numeric(12,2),
  fat_avulso          numeric(12,2),
  -- Pacientes
  pacientes           integer,
  retorno             integer,
  ticket_medio        numeric(10,2),
  -- Funil
  leads               integer,
  agendamentos        integer,
  comparecimentos     integer,
  vendas              integer,
  -- Margem
  margem_pct          numeric(5,4), -- ex: 0.639
  protocolos_vendidos integer,
  -- Metas (Cronograma GPS)
  meta_mensal         numeric(12,2),
  meta_mensal_fat     numeric(12,2),
  meta_mensal_pct     numeric(5,4),
  meta_anual          numeric(12,2),
  meta_anual_fat      numeric(12,2),
  meta_anual_pct      numeric(5,4),
  -- Procedimentos detalhados
  golden_face         numeric(12,2),
  harmonizacao        numeric(12,2),
  glow_skin           numeric(12,2),
  preen_botox         numeric(12,2),
  outros_proc         numeric(12,2),
  -- Origem do dado
  source              text not null default 'sheets', -- 'sheets' | 'manual'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (client_id, month, year)
);

-- ============================================================
-- ASSETS DE PRODUTO (Knowledge Hub — Metodologia)
-- ============================================================
create table product_assets (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  file_name  text,
  file_url   text not null,
  file_type  text not null default 'pdf', -- 'pdf' | 'link'
  label      text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ANÁLISES MANUAIS DA EQUIPE AXIS
-- ============================================================
create table analyses (
  id                uuid primary key default uuid_generate_v4(),
  client_id         uuid not null references clients(id) on delete cascade,
  title             text not null,
  content           text not null,         -- texto rico (markdown)
  visible_to_client boolean not null default false,
  author_id         uuid references auth.users(id),
  created_at        timestamptz not null  default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- PERFIS DE USUÁRIO (admin AXIS vs cliente)
-- ============================================================
create table user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'client', -- 'admin' | 'client'
  full_name  text,
  client_id  uuid references clients(id),   -- preenchido se role = 'client'
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table products         enable row level security;
alter table clients          enable row level security;
alter table diagnostics      enable row level security;
alter table client_uploads   enable row level security;
alter table metrics_monthly  enable row level security;
alter table analyses         enable row level security;
alter table plan_actions     enable row level security;
alter table product_assets   enable row level security;
alter table user_profiles    enable row level security;

-- Helper: papel do usuário logado
create or replace function get_my_role()
returns text language sql security definer as $$
  select role from user_profiles where id = auth.uid()
$$;

-- Helper: client_id do usuário logado
create or replace function get_my_client_id()
returns uuid language sql security definer as $$
  select client_id from user_profiles where id = auth.uid()
$$;

-- Produtos: admin escreve, todos leem
create policy "products_read"   on products for select using (true);
create policy "products_write"  on products for all    using (get_my_role() = 'admin');

-- Clientes: admin vê todos; cliente vê só o próprio
create policy "clients_admin"  on clients for all    using (get_my_role() = 'admin');
create policy "clients_portal" on clients for select using (id = get_my_client_id());

-- Diagnóstico: admin escreve, cliente lê o próprio
create policy "diagnostics_admin"  on diagnostics for all    using (get_my_role() = 'admin');
create policy "diagnostics_portal" on diagnostics for select using (client_id = get_my_client_id());

-- Uploads: admin escreve, cliente lê o próprio
create policy "uploads_admin"  on client_uploads for all    using (get_my_role() = 'admin');
create policy "uploads_portal" on client_uploads for select using (client_id = get_my_client_id());

-- Métricas: admin escreve, cliente lê o próprio
create policy "metrics_admin"  on metrics_monthly for all    using (get_my_role() = 'admin');
create policy "metrics_portal" on metrics_monthly for select using (client_id = get_my_client_id());

-- Análises: admin escreve; cliente vê só as marcadas como visíveis
create policy "analyses_admin"  on analyses for all    using (get_my_role() = 'admin');
create policy "analyses_portal" on analyses for select using (
  client_id = get_my_client_id() and visible_to_client = true
);

-- Ações do plano: admin escreve, cliente lê o próprio
create policy "plan_actions_admin"  on plan_actions for all    using (get_my_role() = 'admin');
create policy "plan_actions_portal" on plan_actions for select using (client_id = get_my_client_id());

-- Assets de produto: somente admin
create policy "product_assets_admin" on product_assets for all using (get_my_role() = 'admin');

-- Perfis: cada um vê o próprio
create policy "profiles_own" on user_profiles for select using (id = auth.uid());
create policy "profiles_admin" on user_profiles for all using (get_my_role() = 'admin');

-- ============================================================
-- PILAR (ENUM para pilares estratégicos AXIS)
-- ============================================================
create type pilar_type as enum ('posicionamento', 'comercial', 'trafego', 'protocolo');

-- ============================================================
-- AÇÕES DO PLANO ESTRATÉGICO
-- ============================================================
create table plan_actions (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references clients(id) on delete cascade,
  analysis_id uuid references analyses(id) on delete cascade,
  action_text text not null,
  phase       text,
  position    integer not null default 0,
  status      text not null default 'pendente'
              check (status in ('pendente', 'em_andamento', 'concluida', 'bloqueada')),
  pilar       pilar_type,
  notes       text,
  due_date    date,
  assignee    text check (assignee in ('consultor', 'cliente', 'ambos')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- LOGS DE USO (tokens / custo por geração de IA)
-- ============================================================
create table if not exists usage_logs (
  id                    uuid primary key default uuid_generate_v4(),
  client_id             uuid references clients(id) on delete set null,
  type                  text not null, -- 'strategic_plan' | 'monthly_analysis' | 'cmo'
  model                 text not null,
  input_tokens          integer not null default 0,
  output_tokens         integer not null default 0,
  cache_creation_tokens integer not null default 0,
  cache_read_tokens     integer not null default 0,
  cost_usd              numeric(10,6) not null default 0,
  created_at            timestamptz not null default now()
);

alter table usage_logs enable row level security;
create policy "Admin acessa usage_logs"
  on usage_logs for all
  using (get_my_role() = 'admin');

-- ============================================================
-- TRIGGER: atualiza updated_at automaticamente
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_products_updated_at
  before update on products
  for each row execute function update_updated_at();

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

create trigger trg_diagnostics_updated_at
  before update on diagnostics
  for each row execute function update_updated_at();

create trigger trg_metrics_updated_at
  before update on metrics_monthly
  for each row execute function update_updated_at();

create trigger trg_analyses_updated_at
  before update on analyses
  for each row execute function update_updated_at();

-- ============================================================
-- DADOS INICIAIS: produtos AXIS
-- ============================================================
insert into products (name, slug, description, methodology, stages) values
(
  'GPS',
  'gps',
  'Gestão e Posicionamento Estratégico — produto de entrada da AXIS',
  'Diagnóstico, posicionamento de marca, tráfego pago e gestão de resultados mensais.',
  '[
    {"order": 1, "title": "Diagnóstico inicial", "description": "Mapeamento completo da clínica"},
    {"order": 2, "title": "Posicionamento", "description": "Definição de público, oferta e diferencial"},
    {"order": 3, "title": "Estruturação de tráfego", "description": "Configuração de campanhas e funil"},
    {"order": 4, "title": "Gestão mensal", "description": "Reuniões mensais, análise de métricas e otimizações"}
  ]'
),
(
  'PAE Starter',
  'pae_starter',
  'Plano de Aceleração Estratégica — nível inicial',
  'Aceleração de resultados com gestão integrada de tráfego, conteúdo e estratégia comercial.',
  '[
    {"order": 1, "title": "Onboarding PAE", "description": "Alinhamento de metas e estrutura"},
    {"order": 2, "title": "Plano de 90 dias", "description": "Estratégia estruturada por trimestre"},
    {"order": 3, "title": "Execução integrada", "description": "Tráfego + conteúdo + comercial"},
    {"order": 4, "title": "Review quinzenal", "description": "Análise e correção de rota"}
  ]'
),
(
  'PAE Scale',
  'pae_scale',
  'Plano de Aceleração Estratégica — nível escala',
  'Gestão completa para clínicas em fase de escala, com CMO dedicado e times integrados.',
  '[
    {"order": 1, "title": "Diagnóstico de escala", "description": "Mapeamento de gargalos e oportunidades"},
    {"order": 2, "title": "Estrutura de times", "description": "Definição de papéis e processos"},
    {"order": 3, "title": "Gestão full-service", "description": "CMO + tráfego + estratégia + CS"},
    {"order": 4, "title": "Review semanal", "description": "Acompanhamento intensivo de métricas"}
  ]'
);
