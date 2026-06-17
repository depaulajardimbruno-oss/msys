# MSys Treinamentos

Sistema de gerenciamento, agendamento e acompanhamento de treinamentos de clientes.

---

## ✅ Pré-requisitos

- Conta no [GitHub](https://github.com) (gratuito)
- Conta no [Vercel](https://vercel.com) (gratuito, conectar via GitHub)
- Conta no [Supabase](https://supabase.com) (gratuito)

---

## 🗄️ 1. Configurar o banco de dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **SQL Editor** (menu lateral)
3. Cole todo o conteúdo do arquivo `supabase-schema.sql` e clique em **Run**
4. Vá em **Settings → API** e anote:
   - **Project URL** (ex: `https://xyzabc.supabase.co`)
   - **anon public** key

---

## 👤 2. Criar o primeiro usuário gestor

1. No Supabase, vá em **Authentication → Users → Invite user**
2. Digite o e-mail do gestor MSys
3. Após o usuário se cadastrar, vá em **Table Editor → profiles**
4. Encontre o registro do usuário e altere o campo `role` para `gestor`

---

## 📁 3. Subir o código no GitHub

1. Crie um repositório novo em [github.com/new](https://github.com/new) (pode ser privado)
2. No terminal (ou GitHub Desktop), dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "inicial: MSys Treinamentos"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/msys-treinamentos.git
git push -u origin main
```

---

## 🚀 4. Publicar na Vercel

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório que você criou no GitHub
3. Na tela de configuração, clique em **Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | sua Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sua anon key do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | sua service_role key do Supabase (Settings → API) — **nunca** use o prefixo `NEXT_PUBLIC_` nessa variável, ela precisa ficar restrita ao servidor |

4. Clique em **Deploy** — o site estará no ar em ~2 minutos!

---

## 🔄 Atualizações futuras

Sempre que você modificar o código e fazer `git push`, a Vercel publica automaticamente.

---

## 👥 Perfis de acesso

| Perfil | Acesso |
|--------|--------|
| **Gestor** | Dashboard completo, clientes, treinamentos, revalidações, relatórios |
| **Participante** | Apenas portal com link Teams, conteúdo, cronograma e avaliação |

Para adicionar participantes:
1. Convidar via Supabase → Authentication → Invite user
2. No Table Editor → participantes, vincular o `profile_id` ao `treinamento_id`

---

## 📁 Estrutura do projeto

```
app/
  login/          → Página de login
  dashboard/      → Painel do gestor
  treinamentos/   → Lista e detalhes de treinamentos
  clientes/       → Gestão de clientes
  revalidacoes/   → Controle de revalidações
  calendario/     → Calendário de sessões
  relatorios/     → Métricas e desempenho
  portal/         → Portal do participante
  avaliacao/      → Avaliação e feedback
components/
  layout/Sidebar  → Menu lateral
lib/
  supabase.ts     → Cliente Supabase
types/
  database.ts     → Tipagem TypeScript
supabase-schema.sql → Script do banco de dados
```
