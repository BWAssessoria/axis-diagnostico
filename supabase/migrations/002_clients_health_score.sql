-- Migration: adiciona health_score na tabela clients
-- Executar via: Supabase Dashboard > SQL Editor

alter table clients
  add column if not exists health_score int check (health_score >= 0 and health_score <= 100);

comment on column clients.health_score is 'Score de saúde do cliente (0-100). < 40 = Risco de Churn. Recalculado via /api/health-score/[id]';
