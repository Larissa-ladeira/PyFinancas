# PyFinanças 💰

Aplicação para controle financeiro pessoal com foco em **sair do endividamento**. Combina um frontend React + Vite com um backend alternativo em Streamlit (Python).

## Funcionalidades

- **Dashboard** — Visão geral de receitas, despesas, saldo e gráficos
- **Transações** — Cadastro de receitas e despesas por categoria
- **Lembretes** — Contas a pagar com vencimento, status pago/pendente e filtro por mês
- **Desfudência** — Controle de dívidas com:
  - Juros (% a.m.) e parcela mínima
  - Estratégias Bola de Neve (menor saldo) e Avalanche (maior juro)
  - Simulador de liberdade financeira
  - Previsão de data de quitação
- **Extrato** — Histórico de transações com filtros e busca por descrição
- **Configurações** — Definição de salário base e indicadores

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend (alternativo) | Python, Streamlit, Plotly |
| Banco | Supabase (PostgreSQL + Auth) |
| Gráficos | Recharts |

## Como rodar

### Frontend (React)

```bash
cd frontend
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env
npm install
npm run dev
```

### Backend (Streamlit)

```bash
cp .env.example .env
# Preencha SUPABASE_URL e SUPABASE_KEY no .env
streamlit run app.py
```

### Banco de dados

Execute o conteúdo de `setup_supabase.sql` no SQL Editor do Supabase para criar as tabelas e políticas de segurança.

## Estrutura

```
PyFinanças/
├── frontend/          # React + Vite
│   └── src/
│       ├── components/  # Layout, ProtectedRoute
│       ├── pages/       # Dashboard, Transações, Lembretes, Dívidas, Extrato, Config
│       ├── lib/         # Cliente Supabase
│       └── types/       # Tipos TypeScript
├── app.py             # Backend Streamlit
├── setup_supabase.sql # Schema do banco
└── .env.example       # Variáveis de ambiente (exemplo)
```
