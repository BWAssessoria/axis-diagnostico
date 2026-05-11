# AXIS 360 — Plataforma Interna de Gestão de Clientes

## O que é

SaaS interno da AXIS Clinic Brasil para a equipe de entrega acompanhar clínicas de estética.

- **Produção:** `360.axisclinicbrasil.com` (Vercel)
- **Repo local:** `C:\Dev\axis-360`
- **GitHub:** `github.com/BWAssessoria/axis-diagnostico` (branch `main`)
- **Supabase project:** `axmgdllmvsjtuwvrabiz`
- **Vercel team:** `team_PU2xAJnrD0qdV50D4A0OrzAc`
- **Login dashboard:** senha `axis2026` (env `NEXT_PUBLIC_ADMIN_PASSWORD`)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js (App Router), React |
| Estilos | Inline styles — sem Tailwind, sem CSS modules |
| Banco | Supabase (PostgreSQL + RLS permissiva allow_all) |
| PDF | html2canvas + jsPDF (dynamic import) |
| Deploy | Vercel (push na main = deploy automático) |
| Ícones | lucide-react |

## Design System (inline styles)

Paleta de variáveis definidas no topo de cada arquivo:

```js
const O="#FF4500",OL="#FFF4F0",OB="#FFD4C4";   // laranja (primary)
const G="#00C853",GL="#E8F9EF";                 // verde
const R="#E53935",RL="#FFEBEE";                 // vermelho
const Y="#FF9800",YL="#FFF8E1";                 // amarelo
const B="#2196F3",BL="#E3F2FD";                 // azul
const T="#1A1A1A",T2="#6B6B6B",T3="#999";       // textos
const BD="#E8E8E8",BG="#F4F5F7",C="#FFFFFF";    // bordas/fundo/branco
```

## Banco de Dados

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `clientes` | Cadastro da clínica: `id, nome_clinica, responsavel, cidade, whatsapp, meta(jsonb), created_at` |
| `diagnosticos` | Snapshot do formulário: `id, cliente_id(fk), data(jsonb), periodo, versao, created_at` |
| `membros` | Equipe AXIS: `id, nome, email, role, ativo, created_at` |
| `cliente_membro` | Junction: `cliente_id, membro_id, papel` |

### clientes.meta (jsonb)
Campos estratégicos editáveis pela equipe:
- `plano_contratado`, `plano_recomendado`, `meta_interna`, `notas_estrategicas`, `proxima_sessao`
- `tipo_cliente` — `"cliente"` (padrão) ou `"embaixador"`
- `plano_horizonte` — `"90"`, `"180"` (padrão) ou `"365"`

### membros.role — valores válidos (check constraint)
`Gestor | Consultor | CS | SDR | Analista | Financeiro | Outro`

### RLS
Todas as tabelas têm `allow_all` policy para `public` — sem autenticação Supabase.

## Estrutura de Arquivos

```
app/
  page.js                    ← Formulário público de diagnóstico
  dashboard/
    page.js                  ← Lista de clientes + Analytics + Equipe (login por senha)
    [id]/
      page.js                ← Prontuário do cliente (4 abas + PDF)
lib/
  analysis.js                ← Motor de análise: analyze(), analyzeICP(), buildDiagnostico(),
                               buildCMOAnalysis(), getPacRecomendacoes(), nivelFn(), fmtR(), pm()
```

## Fluxo de dados

1. Clínica preenche formulário em `/` → grava em `clientes` + `diagnosticos` (diagnóstico inicial)
2. Para novo diagnóstico de cliente existente: `/dashboard/[id]` → botão "Novo Diagnóstico" → abre `/?cliente_id={id}`
3. Equipe acessa `/dashboard` (senha) → lista todos os clientes com scores
4. Clica no cliente → `/dashboard/[id]` → prontuário completo com 4 abas

## Lógica de análise (`lib/analysis.js`)

- `analyze(data)` → scores por área (comercial/marketing/operacional/financeiro) + saúde total
- `analyzeICP(data)` → produto AXIS: `"Método Axis"` (faturamento ≥ R$10k/mês) ou `"Fora do ICP"` / `"A Qualificar"`
- `buildDiagnostico(data, produto, plano)` → `{ metaSmart, protocolos, planos: {p90, p180, p365}, prioridades }`
- `buildCMOAnalysis(data, scores, produto, plano)` → SWOT, visão, alavancas, posicionamento
- `getPacRecomendacoes(produto, plano, data)` → ações PAC personalizadas

**GPS foi removido do sistema de diagnóstico** — GPS é infoproduto vendido separadamente.

## Planos de ação (p90 / p180 / p365)

Cada diagnóstico tem 3 planos gerados automaticamente:
- **p90** (3 meses): Onboarding → Fundação → Resultados Iniciais
- **p180** (6 meses): +Conteúdo & Otimização
- **p365** (12 meses): +Consolidação & Expansão

O prontuário exibe abas selecionáveis. O plano padrão visível é controlado por `plano_horizonte` em `clientes.meta`.

## Tags de cliente

- **Cliente** (padrão): badge azul com ícone UserCheck
- **Embaixador**: badge dourado com ícone Star preenchido

Visível na lista do dashboard e no prontuário. Editável via modal de edição do cliente.

## Prontuário — múltiplos diagnósticos

1 cliente → N diagnósticos (cada nova sessão 3/6/9/12 meses = novo registro em `diagnosticos`)
- `diagIdx` controla qual diagnóstico está sendo visualizado
- `data = diagnosticos[diagIdx]?.data` é o shortcut para os dados do form
- Período gravado: `inicial | 3_meses | 6_meses | 9_meses | 12_meses`

## PDF

Ao clicar em "PDF":
1. `pdfMode = true` → renderiza TODAS as 4 abas simultaneamente
2. Aguarda 500ms para o DOM atualizar
3. `html2canvas` captura `printRef.current`
4. `jsPDF` pagina e salva
5. `pdfMode = false` → volta ao estado normal

## Auth

- Senha compartilhada via `sessionStorage.setItem("axis-authed", "1")`
- Logout: `sessionStorage.removeItem("axis-authed")`
- Não usa Supabase Auth

## Padrões de código

- **Sem TypeScript** — tudo `.js`
- **Sem comentários óbvios** — só quando o WHY não é claro
- **Inline styles** — 100% (sem classes CSS)
- **Supabase**: duas queries separadas (não nested select) para clientes + diagnósticos
- **Deploy**: `git push` na branch `main` → Vercel detecta e faz deploy automático (~1min)
- **Hard refresh**: `Ctrl+Shift+R` para limpar cache após deploys
