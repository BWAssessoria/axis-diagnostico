-- Migration 003: pilar_type ENUM, coluna pilar em plan_actions, tabela product_assets
-- Executar via: Supabase Dashboard > SQL Editor

-- ENUM para os pilares estratégicos AXIS
do $$ begin
  create type pilar_type as enum ('posicionamento', 'comercial', 'trafego', 'protocolo');
exception when duplicate_object then null;
end $$;

-- Coluna pilar em plan_actions
alter table plan_actions
  add column if not exists pilar pilar_type;

comment on column plan_actions.pilar is 'Pilar estratégico AXIS: posicionamento | comercial | trafego | protocolo';

-- Knowledge Hub: arquivos e links de metodologia por produto
create table if not exists product_assets (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  file_name  text,
  file_url   text not null,
  file_type  text not null default 'pdf', -- 'pdf' | 'link'
  label      text,
  created_at timestamptz not null default now()
);

alter table product_assets enable row level security;

create policy "product_assets_admin"
  on product_assets for all
  using (get_my_role() = 'admin');

comment on table product_assets is 'Arquivos e links de metodologia por produto (Knowledge Hub)';
