-- =============================================
-- MSys Treinamentos — Schema do banco de dados
-- Execute este script no Supabase SQL Editor
-- =============================================

-- Habilita extensão UUID
create extension if not exists "uuid-ossp";

-- ---- CLIENTES ----
create table clientes (
  id            uuid primary key default uuid_generate_v4(),
  nome          text not null,
  tipo          text not null default 'Factoring',
  alias         text unique,
  contato_nome  text,
  contato_email text,
  created_at    timestamptz default now()
);

-- ---- PROFILES (estende auth.users do Supabase) ----
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  email      text not null,
  role       text not null default 'participante' check (role in ('gestor','participante')),
  cliente_id uuid references clientes(id) on delete set null,
  created_at timestamptz default now()
);

-- Cria profile automaticamente ao cadastrar usuário
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', 'Usuário'), new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---- TREINAMENTOS ----
create table treinamentos (
  id             uuid primary key default uuid_generate_v4(),
  cliente_id     uuid references clientes(id) on delete cascade,
  modulo         text not null,
  tipo           text not null default 'novo_cliente' check (tipo in ('novo_cliente','revalidacao')),
  status         text not null default 'agendado' check (status in ('agendado','em_andamento','concluido','cancelado')),
  data_inicio    date not null,
  data_fim       date,
  carga_horaria  integer not null default 8,
  instrutor      text not null,
  link_teams     text,
  conteudo       text[] default '{}',
  chamados_count integer not null default 0,
  created_at     timestamptz default now()
);

-- ---- MATERIAIS ----
create table materiais (
  id              uuid primary key default uuid_generate_v4(),
  treinamento_id  uuid references treinamentos(id) on delete cascade,
  nome            text not null,
  tipo            text not null default 'manual' check (tipo in ('manual','slides','gravacao','outro')),
  url             text not null,
  created_at      timestamptz default now()
);

-- ---- SESSOES (cronograma de cada treinamento) ----
create table sessoes (
  id              uuid primary key default uuid_generate_v4(),
  treinamento_id  uuid references treinamentos(id) on delete cascade,
  inicio          text not null,   -- ex: "09:00"
  fim             text not null,   -- ex: "12:00"
  descricao       text not null,
  created_at      timestamptz default now()
);

-- ---- PARTICIPANTES ----
create table participantes (
  id              uuid primary key default uuid_generate_v4(),
  treinamento_id  uuid references treinamentos(id) on delete cascade,
  profile_id      uuid references profiles(id) on delete cascade,
  created_at      timestamptz default now(),
  unique(treinamento_id, profile_id)
);

-- ---- AVALIACOES ----
create table avaliacoes (
  id                 uuid primary key default uuid_generate_v4(),
  treinamento_id     uuid references treinamentos(id) on delete cascade,
  participante_id    uuid references profiles(id) on delete cascade,
  nota               integer not null check (nota between 1 and 5),
  expectativa        text,
  didatica           text,
  duvidas_restantes  text,
  comentario         text,
  created_at         timestamptz default now(),
  unique(treinamento_id, participante_id)
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table clientes     enable row level security;
alter table profiles     enable row level security;
alter table treinamentos enable row level security;
alter table materiais    enable row level security;
alter table sessoes      enable row level security;
alter table participantes enable row level security;
alter table avaliacoes   enable row level security;

-- Gestores veem tudo
create policy "gestores_all" on clientes     for all using (exists (select 1 from profiles where id = auth.uid() and role = 'gestor'));
create policy "gestores_all" on treinamentos for all using (exists (select 1 from profiles where id = auth.uid() and role = 'gestor'));
create policy "gestores_all" on materiais    for all using (exists (select 1 from profiles where id = auth.uid() and role = 'gestor'));
create policy "gestores_all" on sessoes      for all using (exists (select 1 from profiles where id = auth.uid() and role = 'gestor'));
create policy "gestores_all" on participantes for all using (exists (select 1 from profiles where id = auth.uid() and role = 'gestor'));
create policy "gestores_all" on avaliacoes   for all using (exists (select 1 from profiles where id = auth.uid() and role = 'gestor'));

-- Cada usuário vê seu próprio profile
create policy "profile_proprio" on profiles for all using (id = auth.uid());

-- Função auxiliar que verifica se o usuário atual é gestor, sem disparar
-- recursão de RLS (roda com security definer, ignorando a policy abaixo
-- na hora de fazer essa checagem interna).
create or replace function public.is_gestor()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'gestor'
  );
$$ language sql security definer set search_path = public stable;

-- Gestores podem ver todos os profiles (necessário para listar participantes)
create policy "gestores_veem_profiles" on profiles for select
  using (public.is_gestor());

-- Participante vê os treinamentos da sua própria empresa (via cliente_id no profile)
create policy "participante_treinamentos" on treinamentos for select
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.cliente_id = treinamentos.cliente_id
  ));

-- Participante vê sessões de treinamentos da sua empresa
create policy "participante_sessoes" on sessoes for select
  using (exists (
    select 1 from treinamentos
    join profiles on profiles.cliente_id = treinamentos.cliente_id
    where treinamentos.id = sessoes.treinamento_id and profiles.id = auth.uid()
  ));

-- Participante vê materiais de treinamentos da sua empresa
create policy "participante_materiais" on materiais for select
  using (exists (
    select 1 from treinamentos
    join profiles on profiles.cliente_id = treinamentos.cliente_id
    where treinamentos.id = materiais.treinamento_id and profiles.id = auth.uid()
  ));

-- Participante pode avaliar qualquer treinamento da própria empresa
create policy "participante_avaliacao" on avaliacoes for insert
  with check (participante_id = auth.uid() and exists (
    select 1 from treinamentos
    join profiles on profiles.cliente_id = treinamentos.cliente_id
    where treinamentos.id = avaliacoes.treinamento_id and profiles.id = auth.uid()
  ));

create policy "participante_avaliacao_select" on avaliacoes for select
  using (participante_id = auth.uid());

-- =============================================
-- DADOS DE EXEMPLO (opcional)
-- =============================================

-- Descomente abaixo para inserir dados de demonstração

/*
insert into clientes (nome, tipo, contato_nome, contato_email) values
  ('Factoring Sul Ltda', 'Factoring', 'Marco Antunes', 'marco@factoringsul.com.br'),
  ('Nexo FIDC', 'FIDC', 'Renata Gomes', 'renata@nexofidc.com.br'),
  ('Crédito Ágil ESC', 'ESC', 'Túlio Santos', 'tulio@creditoagil.com.br'),
  ('Alpha Securitizadora', 'Securitizadora', 'Carla Fonseca', 'carla@alphasec.com.br');
*/
