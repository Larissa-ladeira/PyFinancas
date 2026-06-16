# PyFinanças 💰

> **🌐 Aplicação online:** [https://pyfinancas-1.onrender.com/](https://pyfinancas-1.onrender.com/)

Aplicação para controle financeiro pessoal com foco em **sair do endividamento**.

## Funcionalidades

- **Dashboard** — Visão geral de receitas, despesas, saldo, patrimônio líquido e gráficos
- **Despesas Mensais** — Controle de gastos mensais com orçamentos por categoria
- **Renda Extra** — Registro de receitas adicionais
- **Lembretes** — Contas a pagar com vencimento e status pago/pendente
- **Desfudência** — Controle de dívidas com:
  - Estratégias Bola de Neve (menor saldo) e Avalanche (maior juro)
  - Simulador de liberdade financeira
  - Previsão de data de quitação
- **Acordos** — Parcelamento de dívidas com acompanhamento
- **Metas de Economia** — Definição e acompanhamento de objetivos financeiros
- **Transações Recorrentes** — Automatização de receitas/despesas fixas
- **Extrato** — Histórico completo com filtros, busca e importação CSV
- **Calendário Financeiro** — Visão mensal de todos os compromissos
- **Relatórios** — Análise anual com gráficos e indicadores
- **Configurações** — Perfil, salário base, notificações por e-mail

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Node.js (servidor estático) |
| Banco | Supabase (PostgreSQL + Auth) |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Deploy | Render |

## Como rodar localmente

```bash
# Frontend (React)
cd frontend
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env
npm install
npm run dev
```

### Banco de dados

Execute o conteúdo de `sql/setup_supabase.sql` no SQL Editor do Supabase.

## Estrutura

```
PyFinanças/
├── frontend/          # React + Vite
│   └── src/
│       ├── components/  # Layout, Onboarding
│       ├── pages/       # 13 páginas
│       ├── lib/         # Cliente Supabase
│       └── types/       # Tipos TypeScript
├── sql/               # Scripts do banco
├── server.js          # Servidor Node (deploy)
└── render.yaml        # Configuração Render
```
