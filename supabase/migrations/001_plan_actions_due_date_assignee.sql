-- Migration: adiciona due_date e assignee na tabela plan_actions
-- Executar via: Supabase Dashboard > SQL Editor

alter table plan_actions
  add column if not exists due_date  date,
  add column if not exists assignee  text check (assignee in ('consultor', 'cliente', 'ambos'));

comment on column plan_actions.due_date  is 'Data limite para conclusão desta ação';
comment on column plan_actions.assignee  is 'Responsável pela ação: consultor | cliente | ambos';
