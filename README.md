# MG Multas — Sistema de Análise de Notificações

Sistema Next.js que analisa notificações de infração de trânsito via IA (Claude Sonnet),
extrai os dados automaticamente e gera dossiê completo de venda para o consultor.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Anthropic SDK** (Claude Sonnet 4)
- **Vercel** (deploy recomendado)

---

## Instalação local

```bash
# 1. Clone ou extraia o projeto
cd mg-multas

# 2. Instale dependências
npm install

# 3. Configure a chave da API
cp .env.example .env.local
# Edite .env.local e coloque sua ANTHROPIC_API_KEY

# 4. Rode em desenvolvimento
npm run dev
# Acesse: http://localhost:3000
```

---

## Deploy na Vercel (recomendado)

### Opção A — Via GitHub (mais fácil)

1. Crie um repositório no GitHub e faça push do projeto
2. Acesse [vercel.com](https://vercel.com) → "New Project" → importe o repositório
3. Em **Environment Variables**, adicione:
   - `ANTHROPIC_API_KEY` = sua chave `sk-ant-...`
4. Clique em **Deploy**

### Opção B — Via CLI

```bash
npm install -g vercel
vercel login
vercel
# Quando perguntar environment variables, adicione ANTHROPIC_API_KEY
vercel --prod
```

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Sim | Chave da API Anthropic (`sk-ant-...`) |

Obtenha sua chave em: [console.anthropic.com](https://console.anthropic.com)

---

## Estrutura do Projeto

```
mg-multas/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analisar/
│   │   │       └── route.ts        ← API route (server-side, chama Anthropic)
│   │   ├── analise/
│   │   │   └── page.tsx            ← Página de upload e análise
│   │   ├── projetos/
│   │   │   └── page.tsx            ← Lista de casos analisados
│   │   ├── dashboard/
│   │   │   └── page.tsx            ← Dashboard com métricas
│   │   ├── layout.tsx              ← Layout raiz com sidebar
│   │   └── globals.css             ← Design system MG Multas
│   ├── components/
│   │   ├── Sidebar.tsx             ← Navegação lateral
│   │   └── ResultadoCard.tsx       ← Card completo do dossiê
│   └── lib/
│       ├── types.ts                ← Tipagens TypeScript
│       └── prompt.ts               ← System prompt para a IA
├── .env.example
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Como funciona a API Route

O arquivo `src/app/api/analisar/route.ts` é executado **server-side** na Vercel.
Ele recebe o arquivo via `FormData`, converte para base64, envia para o Claude Sonnet
junto com o system prompt especializado em CTB, e retorna o JSON estruturado.

Por ser server-side, a `ANTHROPIC_API_KEY` nunca fica exposta no browser.

---

## Armazenamento

Os projetos são salvos no `localStorage` do browser — sem banco de dados externo.
Para persistência em produção, integre com Supabase adicionando chamadas ao banco
na API route após receber o resultado da IA.

---

## Suporte a formatos

| Formato | Suportado |
|---|---|
| PDF | ✅ |
| JPG / JPEG | ✅ |
| PNG | ✅ |
| WebP | ✅ |
| Tamanho máximo | 20 MB |
