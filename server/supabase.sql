-- =====================================================================
-- GastroMatch - banco de dados no Supabase (PostgreSQL)
--
-- COMO USAR: Supabase > SQL Editor > New query > cole TUDO > Run.
-- Pode rodar de novo sem problema (o script é idempotente).
--
-- Como a segurança funciona: todas as tabelas têm RLS ligado e NENHUMA
-- política, então o navegador não lê nem grava nas tabelas diretamente.
-- O site só conversa com o banco pelas funções gm_* abaixo, que conferem
-- quem está logado (auth.uid()) e aplicam as mesmas regras do servidor
-- Node (server/index.js): perfil, curadoria, raio de entrega, cupom, etc.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) TABELAS
-- ---------------------------------------------------------------------
create table if not exists public.usuario (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  perfil text not null default 'amador' check (perfil in ('amador','criador','admin')),
  criado_em timestamptz not null default now()
);

create table if not exists public.criador_conteudo (
  id bigint generated always as identity primary key,
  id_usuario uuid references public.usuario(id) on delete cascade,
  chef_id text not null unique,
  nome_publico text,
  tipo_perfil text not null default 'chef',
  documento_path text,
  status_validacao text not null default 'PENDENTE' check (status_validacao in ('PENDENTE','APROVADO','REJEITADO')),
  termo_sanitario_aceito boolean not null default false,
  raio_entrega_km numeric not null default 5 check (raio_entrega_km between 1 and 15)
);

create table if not exists public.receita (
  id bigint generated always as identity primary key,
  id_criador bigint not null references public.criador_conteudo(id) on delete cascade,
  titulo text not null,
  descricao text not null default '',
  instrucoes jsonb not null default '[]'::jsonb,
  ingredientes jsonb not null default '[]'::jsonb,
  categoria_restricao text not null default 'sem restrição',
  categoria text not null default 'alta',
  tempo_preparo_min integer not null check (tempo_preparo_min > 0),
  preco numeric(10,2) not null check (preco > 0),
  link_videoaula text not null default '',
  imagem text not null default '',
  status text not null default 'RASCUNHO' check (status in ('RASCUNHO','PUBLICADA')),
  criado_em timestamptz not null default now()
);

create table if not exists public.kit_ingrediente (
  id bigint generated always as identity primary key,
  id_receita bigint not null unique references public.receita(id) on delete cascade,
  composicao text not null default '',
  valor_kit numeric(10,2) not null check (valor_kit >= 0)
);

create table if not exists public.transacao_financeira (
  id bigint generated always as identity primary key,
  id_usuario uuid not null references public.usuario(id) on delete cascade,
  tipo text not null check (tipo in ('receita','assinatura','kit')),
  ref_id text not null,
  chef_id text not null,
  valor numeric(10,2) not null,
  metodo text not null,
  cupom text not null default '',
  status text not null check (status in ('APROVADA','RECUSADA')),
  http integer not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.acesso_receita (
  id_usuario uuid not null references public.usuario(id) on delete cascade,
  id_receita text not null,
  id_transacao bigint references public.transacao_financeira(id) on delete set null,
  primary key (id_usuario, id_receita)
);

create table if not exists public.assinatura (
  id_usuario uuid not null references public.usuario(id) on delete cascade,
  chef_id text not null,
  id_transacao bigint references public.transacao_financeira(id) on delete set null,
  primary key (id_usuario, chef_id)
);

create table if not exists public.pedido_kit (
  id bigint generated always as identity primary key,
  id_usuario uuid not null references public.usuario(id) on delete cascade,
  id_receita text not null,
  nome_receita text not null,
  chef_id text not null,
  valor numeric(10,2) not null,
  entrega text not null,
  janela text not null default '',
  cep text not null default '',
  status text not null default 'AGUARDANDO' check (status in ('AGUARDANDO','CONFIRMADO','ENTREGUE')),
  criado_em timestamptz not null default now()
);

create table if not exists public.post_comunidade (
  id bigint generated always as identity primary key,
  id_usuario uuid not null references public.usuario(id) on delete cascade,
  id_receita text not null,
  chef_id text not null default '',
  legenda text not null,
  estrelas integer not null check (estrelas between 0 and 5),
  imagem text,
  resposta text not null default '',
  respondido_por text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_receita_status on public.receita(status);
create index if not exists idx_tx_chef on public.transacao_financeira(chef_id);
create index if not exists idx_pedido_chef on public.pedido_kit(chef_id);
create index if not exists idx_post_chef on public.post_comunidade(chef_id);

-- ---------------------------------------------------------------------
-- 2) SEGURANÇA: RLS ligado, sem políticas = ninguém acessa direto
-- ---------------------------------------------------------------------
alter table public.usuario enable row level security;
alter table public.criador_conteudo enable row level security;
alter table public.receita enable row level security;
alter table public.kit_ingrediente enable row level security;
alter table public.transacao_financeira enable row level security;
alter table public.acesso_receita enable row level security;
alter table public.assinatura enable row level security;
alter table public.pedido_kit enable row level security;
alter table public.post_comunidade enable row level security;

revoke all on public.usuario, public.criador_conteudo, public.receita, public.kit_ingrediente,
  public.transacao_financeira, public.acesso_receita, public.assinatura, public.pedido_kit,
  public.post_comunidade from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) CADASTRO: ao criar a conta no Supabase Auth, cria o perfil no app
--    (o administrador NUNCA é criado por aqui; só por SQL, veja supabase-contas-demo.sql)
-- ---------------------------------------------------------------------
create or replace function public.gm_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_kind text;
  v_nome text;
  v_raio numeric;
begin
  v_kind := case when m->>'kind' = 'criador' then 'criador' else 'amador' end;
  v_nome := coalesce(nullif(btrim(m->>'name'), ''), split_part(new.email, '@', 1));
  insert into public.usuario (id, nome, email, perfil)
  values (new.id, v_nome, lower(new.email), v_kind)
  on conflict (id) do nothing;
  if v_kind = 'criador' then
    v_raio := least(15, greatest(1, coalesce(nullif(m->>'raio', '')::numeric, 5)));
    insert into public.criador_conteudo (id_usuario, chef_id, nome_publico, tipo_perfil, documento_path,
                                         status_validacao, termo_sanitario_aceito, raio_entrega_km)
    values (new.id, 'u' || substr(replace(new.id::text, '-', ''), 1, 8), v_nome,
            case when m->>'tipo' in ('chef', 'restaurante') then m->>'tipo' else 'chef' end,
            coalesce(m->>'doc', ''), 'PENDENTE', coalesce(m->>'termo', '') = 'true', v_raio);
  end if;
  return new;
end $$;

drop trigger if exists gm_on_auth_user_created on auth.users;
create trigger gm_on_auth_user_created after insert on auth.users
  for each row execute function public.gm_handle_new_user();

-- contas que já existiam no Auth antes deste script ganham perfil de cozinheiro
insert into public.usuario (id, nome, email, perfil)
select u.id, coalesce(nullif(btrim(u.raw_user_meta_data->>'name'), ''), split_part(u.email, '@', 1)), lower(u.email), 'amador'
from auth.users u
where u.email is not null and not exists (select 1 from public.usuario x where x.id = u.id);

-- ---------------------------------------------------------------------
-- 4) FUNÇÕES INTERNAS (não ficam visíveis para o site)
-- ---------------------------------------------------------------------
-- erro com código HTTP embutido: SQLSTATE 'GM422' = HTTP 422, etc.
create or replace function public.gm_fail(p_status int, p_msg text) returns void
language plpgsql as $$
begin
  raise exception '%', p_msg using errcode = 'GM' || p_status::text;
end $$;

create or replace function public.gm_num(p_txt text) returns numeric
language plpgsql immutable as $$
begin
  return p_txt::numeric;
exception when others then
  return null;
end $$;

create or replace function public.gm_d(p_ts timestamptz) returns text
language sql immutable as $$
  select to_char(p_ts at time zone 'America/Sao_Paulo', 'DD/MM/YYYY')
$$;

-- cada linha do texto vira um item da lista (ingredientes e modo de preparo)
create or replace function public.gm_lines(p_txt text) returns jsonb
language sql immutable as $$
  select coalesce(jsonb_agg(s.l order by s.n), '[]'::jsonb)
  from (
    select btrim(t.x, E' \t\r') as l, t.n
    from unnest(string_to_array(coalesce(p_txt, ''), E'\n')) with ordinality as t(x, n)
  ) s
  where s.l <> ''
$$;

-- mapeadores: mesmo formato JSON que o servidor Node devolve
create or replace function public.gm_j_user(u public.usuario) returns jsonb
language sql stable as $$
  select jsonb_build_object('id', u.id, 'name', u.nome, 'email', u.email, 'kind', u.perfil)
$$;

create or replace function public.gm_j_creator(c public.criador_conteudo) returns jsonb
language sql stable as $$
  select case when c.id is null then null::jsonb else jsonb_build_object(
    'id', c.id, 'userId', c.id_usuario, 'chefId', c.chef_id, 'tipo', c.tipo_perfil, 'doc', c.documento_path,
    'raio', c.raio_entrega_km, 'termo', c.termo_sanitario_aceito, 'status', c.status_validacao) end
$$;

create or replace function public.gm_recipe_json(p_id bigint) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'id', 'r' || r.id::text, 'chefId', c.chef_id,
    'status', case when r.status = 'PUBLICADA' then 'publicada' else 'rascunho' end,
    'createdAt', public.gm_d(r.criado_em), 'name', r.titulo, 'desc', r.descricao,
    'restricao', r.categoria_restricao, 'categoria', r.categoria,
    'minutes', r.tempo_preparo_min, 'time', r.tempo_preparo_min::text || ' min',
    'price', r.preco, 'kitPrice', coalesce(k.valor_kit, 0), 'video', r.link_videoaula, 'img', r.imagem,
    'ingredientes', r.ingredientes, 'instrucoes', r.instrucoes)
  from public.receita r
  join public.criador_conteudo c on c.id = r.id_criador
  left join public.kit_ingrediente k on k.id_receita = r.id
  where r.id = p_id
$$;

create or replace function public.gm_tx_json(p_id bigint) returns jsonb
language sql stable as $$
  select jsonb_build_object('id', t.id, 'userId', t.id_usuario, 'type', t.tipo, 'refId', t.ref_id, 'chefId', t.chef_id,
    'valor', t.valor, 'metodo', t.metodo, 'cupom', t.cupom, 'status', t.status, 'http', t.http, 'date', public.gm_d(t.criado_em))
  from public.transacao_financeira t where t.id = p_id
$$;

create or replace function public.gm_order_json(p_id bigint) returns jsonb
language sql stable as $$
  select jsonb_build_object('id', o.id, 'userId', o.id_usuario, 'buyer', us.nome, 'recipeId', o.id_receita,
    'recipeName', o.nome_receita, 'chefId', o.chef_id, 'valor', o.valor, 'entrega', o.entrega, 'slot', o.janela,
    'cep', o.cep, 'status', o.status, 'date', public.gm_d(o.criado_em))
  from public.pedido_kit o join public.usuario us on us.id = o.id_usuario where o.id = p_id
$$;

create or replace function public.gm_post_json(p_id bigint) returns jsonb
language sql stable as $$
  select jsonb_build_object('id', po.id, 'userId', po.id_usuario, 'name', us.nome, 'recipeId', po.id_receita,
    'chefId', po.chef_id, 'caption', po.legenda, 'stars', po.estrelas, 'img', po.imagem, 'reply', po.resposta,
    'replyBy', po.respondido_por, 'date', public.gm_d(po.criado_em))
  from public.post_comunidade po join public.usuario us on us.id = po.id_usuario where po.id = p_id
$$;

-- quem está logado?
create or replace function public.gm_need_user() returns public.usuario
language plpgsql security definer set search_path = public as $$
declare u public.usuario;
begin
  select * into u from public.usuario where id = auth.uid();
  if u.id is null then
    perform public.gm_fail(401, 'Entre na sua conta para continuar.');
  end if;
  return u;
end $$;

create or replace function public.gm_need_approved() returns public.criador_conteudo
language plpgsql security definer set search_path = public as $$
declare u public.usuario; c public.criador_conteudo;
begin
  u := public.gm_need_user();
  select * into c from public.criador_conteudo where id_usuario = u.id;
  if c.id is null then
    perform public.gm_fail(403, 'Esta conta não é de criador.');
  end if;
  if c.status_validacao <> 'APROVADO' then
    perform public.gm_fail(403, 'Seu perfil ainda não foi aprovado pela curadoria.');
  end if;
  return c;
end $$;

create or replace function public.gm_need_admin() returns public.usuario
language plpgsql security definer set search_path = public as $$
declare u public.usuario;
begin
  u := public.gm_need_user();
  if u.perfil <> 'admin' then
    perform public.gm_fail(403, 'Acesso restrito ao administrador.');
  end if;
  return u;
end $$;

-- geolocalização (mesma regra de js/geo.js): CEP -> coordenadas -> distância em km
create or replace function public.gm_coords(p_chef text) returns float8[]
language plpgsql immutable as $$
declare
  known jsonb := '{"torino":[-26.3044,-48.8456],"renato":[-26.2890,-48.8290],"siam":[-26.3260,-48.8570],"bosque":[-26.2780,-48.8700],"lume":[-26.3150,-48.8380],"recanto":[-26.3400,-48.8100],"bufalo":[-26.2950,-48.8820],"verde":[-26.3330,-48.8650]}'::jsonb;
  h int := 0;
  i int;
begin
  if (known -> p_chef) is not null then
    return array[(known -> p_chef ->> 0)::float8, (known -> p_chef ->> 1)::float8];
  end if;
  for i in 1 .. char_length(p_chef) loop
    h := (h * 31 + ascii(substr(p_chef, i, 1))) % 9973;
  end loop;
  return array[
    -26.3044 + ((h % 100)::float8 / 100 - 0.5) * 0.08,
    -48.8456 + (((h / 100) % 100)::float8 / 100 - 0.5) * 0.08];
end $$;

create or replace function public.gm_distance_km(p_cep text, p_chef text) returns numeric
language plpgsql immutable as $$
declare
  n text := regexp_replace(coalesce(p_cep, ''), '\D', '', 'g');
  a float8[];
  b float8[];
  dla float8; dlo float8; h float8;
begin
  if char_length(n) <> 8 then
    return null;
  end if;
  a := array[
    -26.3044 + ((substr(n, 1, 4)::int % 1000)::float8 / 1000 - 0.5) * 0.10,
    -48.8456 + ((substr(n, 5, 4)::int % 1000)::float8 / 1000 - 0.5) * 0.10];
  b := public.gm_coords(p_chef);
  dla := radians(b[1] - a[1]);
  dlo := radians(b[2] - a[2]);
  h := power(sin(dla / 2), 2) + cos(radians(a[1])) * cos(radians(b[1])) * power(sin(dlo / 2), 2);
  return round((2 * 6371 * asin(sqrt(h)))::numeric, 1);
end $$;

create or replace function public.gm_recipe_validate(p_data jsonb) returns void
language plpgsql as $$
begin
  if btrim(coalesce(p_data->>'name', '')) = '' then
    perform public.gm_fail(422, 'Informe o título da receita.');
  end if;
  if not (coalesce(public.gm_num(p_data->>'price'), 0) > 0) then
    perform public.gm_fail(422, 'Informe um preço de acesso maior que zero.');
  end if;
  if not (coalesce(public.gm_num(p_data->>'minutes'), 0) > 0) then
    perform public.gm_fail(422, 'Informe o tempo de preparo em minutos.');
  end if;
end $$;

create or replace function public.gm_kit_save(p_id bigint, p_valor numeric, p_comp text) returns void
language plpgsql as $$
begin
  if p_valor > 0 then
    insert into public.kit_ingrediente (id_receita, composicao, valor_kit) values (p_id, p_comp, p_valor)
    on conflict (id_receita) do update set composicao = excluded.composicao, valor_kit = excluded.valor_kit;
  else
    delete from public.kit_ingrediente where id_receita = p_id;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5) FUNÇÕES DA API (chamadas pelo site)
-- ---------------------------------------------------------------------
create or replace function public.gm_ping() returns boolean
language sql as $$ select true $$;

create or replace function public.gm_me() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.usuario; c public.criador_conteudo;
begin
  select * into u from public.usuario where id = auth.uid();
  if u.id is null then
    return jsonb_build_object('user', null::jsonb);
  end if;
  select * into c from public.criador_conteudo where id_usuario = u.id;
  return jsonb_build_object(
    'user', public.gm_j_user(u),
    'creator', public.gm_j_creator(c),
    'access', coalesce((select jsonb_agg(a.id_receita order by a.id_receita) from public.acesso_receita a where a.id_usuario = u.id), '[]'::jsonb),
    'subs', coalesce((select jsonb_agg(s.chef_id order by s.chef_id) from public.assinatura s where s.id_usuario = u.id), '[]'::jsonb),
    'orders', coalesce((select jsonb_agg(public.gm_order_json(o.id) order by o.id) from public.pedido_kit o where o.id_usuario = u.id), '[]'::jsonb),
    'tx', coalesce((select jsonb_agg(public.gm_tx_json(t.id) order by t.id) from public.transacao_financeira t where t.id_usuario = u.id), '[]'::jsonb));
end $$;

create or replace function public.gm_update_name(p_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.usuario;
begin
  u := public.gm_need_user();
  if char_length(btrim(coalesce(p_name, ''))) < 3 then
    perform public.gm_fail(422, 'Informe o nome completo (mínimo 3 letras).');
  end if;
  update public.usuario set nome = btrim(p_name) where id = u.id;
  select * into u from public.usuario where id = u.id;
  return jsonb_build_object('user', public.gm_j_user(u));
end $$;

-- privacidade: apaga a conta do próprio usuário e todos os dados dela.
-- A senha é conferida pelo site (que entra de novo com ela) e aqui exigimos a palavra EXCLUIR.
-- Ao apagar auth.users, o ON DELETE CASCADE remove: usuario, criador_conteudo, receita, kit_ingrediente,
-- transacao_financeira, acesso_receita, assinatura, pedido_kit e post_comunidade da pessoa.
-- Antes, limpamos o que o criador deixou nos dados de OUTRAS pessoas (acessos, assinaturas e respostas).
create or replace function public.gm_delete_account(p_confirm text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.usuario; c public.criador_conteudo;
begin
  u := public.gm_need_user();
  if u.perfil = 'admin' then
    perform public.gm_fail(403, 'A conta de administrador não pode ser excluída pelo site.');
  end if;
  if coalesce(p_confirm, '') <> 'EXCLUIR' then
    perform public.gm_fail(422, 'Digite EXCLUIR para confirmar a exclusão.');
  end if;
  select * into c from public.criador_conteudo where id_usuario = u.id;
  if c.id is not null then
    delete from public.acesso_receita
      where id_receita in (select 'r' || r.id::text from public.receita r where r.id_criador = c.id);
    delete from public.assinatura where chef_id = c.chef_id;
    update public.post_comunidade set resposta = '', respondido_por = null where respondido_por = c.chef_id;
  end if;
  delete from auth.users where id = u.id;
  return '{}'::jsonb;
end $$;

create or replace function public.gm_recipes() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'recipes', coalesce((select jsonb_agg(public.gm_recipe_json(r.id) order by r.id)
                         from public.receita r where r.status = 'PUBLICADA'), '[]'::jsonb),
    'creators', coalesce((select jsonb_agg(jsonb_build_object('chefId', c.chef_id, 'raio', c.raio_entrega_km,
                                   'name', coalesce(us.nome, c.nome_publico)) order by c.id)
                          from public.criador_conteudo c left join public.usuario us on us.id = c.id_usuario
                          where c.status_validacao = 'APROVADO'), '[]'::jsonb))
$$;

create or replace function public.gm_recipe_create(p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c public.criador_conteudo; v_id bigint; v_ing jsonb; v_cat text;
begin
  c := public.gm_need_approved();
  perform public.gm_recipe_validate(p_data);
  v_ing := public.gm_lines(p_data->>'ingredientes');
  v_cat := case when (p_data->>'categoria') in ('alta','massas','carnes','brasileiras','vegetarianas','sobremesas')
                then p_data->>'categoria' else 'alta' end;
  insert into public.receita (id_criador, titulo, descricao, instrucoes, ingredientes, categoria_restricao, categoria,
                              tempo_preparo_min, preco, link_videoaula, imagem, status)
  values (c.id, btrim(p_data->>'name'), btrim(coalesce(p_data->>'desc', '')), public.gm_lines(p_data->>'instrucoes'), v_ing,
          coalesce(nullif(p_data->>'restricao', ''), 'sem restrição'), v_cat,
          round(public.gm_num(p_data->>'minutes'))::int, round(public.gm_num(p_data->>'price'), 2),
          btrim(coalesce(p_data->>'video', '')), coalesce(p_data->>'img', ''),
          case when coalesce(p_data->>'draft', '') = 'true' then 'RASCUNHO' else 'PUBLICADA' end)
  returning id into v_id;
  perform public.gm_kit_save(v_id, coalesce(public.gm_num(p_data->>'kitPrice'), 0), v_ing::text);
  return jsonb_build_object('recipe', public.gm_recipe_json(v_id));
end $$;

create or replace function public.gm_recipe_update(p_id text, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c public.criador_conteudo; r public.receita; v_id bigint; v_ing jsonb; v_cat text; v_status text;
begin
  c := public.gm_need_approved();
  v_id := public.gm_num(regexp_replace(coalesce(p_id, ''), '^r', ''))::bigint;
  select * into r from public.receita where id = v_id and id_criador = c.id;
  if r.id is null then
    perform public.gm_fail(404, 'Receita não encontrada.');
  end if;
  v_status := case when nullif(p_data->>'status', '') is null then r.status
                   when p_data->>'status' = 'publicada' then 'PUBLICADA' else 'RASCUNHO' end;
  if nullif(p_data->>'status', '') is not null and btrim(coalesce(p_data->>'name', '')) = '' then
    update public.receita set status = v_status where id = r.id;
  else
    perform public.gm_recipe_validate(p_data);
    v_ing := public.gm_lines(p_data->>'ingredientes');
    v_cat := case when (p_data->>'categoria') in ('alta','massas','carnes','brasileiras','vegetarianas','sobremesas')
                  then p_data->>'categoria' else 'alta' end;
    update public.receita set
      titulo = btrim(p_data->>'name'), descricao = btrim(coalesce(p_data->>'desc', '')),
      instrucoes = public.gm_lines(p_data->>'instrucoes'), ingredientes = v_ing,
      categoria_restricao = coalesce(nullif(p_data->>'restricao', ''), 'sem restrição'), categoria = v_cat,
      tempo_preparo_min = round(public.gm_num(p_data->>'minutes'))::int, preco = round(public.gm_num(p_data->>'price'), 2),
      link_videoaula = btrim(coalesce(p_data->>'video', '')), imagem = coalesce(nullif(p_data->>'img', ''), r.imagem),
      status = v_status
    where id = r.id;
    perform public.gm_kit_save(r.id, coalesce(public.gm_num(p_data->>'kitPrice'), 0), v_ing::text);
  end if;
  return jsonb_build_object('recipe', public.gm_recipe_json(r.id));
end $$;

create or replace function public.gm_recipe_delete(p_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c public.criador_conteudo; r public.receita; v_id bigint;
begin
  c := public.gm_need_approved();
  v_id := public.gm_num(regexp_replace(coalesce(p_id, ''), '^r', ''))::bigint;
  select * into r from public.receita where id = v_id and id_criador = c.id;
  if r.id is null then
    perform public.gm_fail(404, 'Receita não encontrada.');
  end if;
  delete from public.receita where id = r.id;
  return '{}'::jsonb;
end $$;

-- compra (receita, assinatura ou kit). O número do cartão NUNCA chega aqui:
-- o site valida o cartão e manda só "card_ok".
create or replace function public.gm_checkout(p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u public.usuario;
  v_price numeric; v_valor numeric; v_desc numeric;
  v_type text; v_chef text; v_ref text; v_cupom text;
  v_dist numeric; v_raio numeric; v_metodo text; v_recusado boolean;
  v_tid bigint; v_oid bigint;
begin
  u := public.gm_need_user();
  if u.perfil <> 'amador' then
    perform public.gm_fail(403, 'Contas de criador e administrador não realizam compras.');
  end if;
  v_price := coalesce(public.gm_num(p_data->>'amount'), 0);
  if not (v_price > 0) then
    perform public.gm_fail(422, 'Valor inválido.');
  end if;
  v_valor := v_price;
  v_cupom := nullif(btrim(coalesce(p_data->>'cupom', '')), '');
  if v_cupom is not null then
    v_desc := case upper(v_cupom) when 'GASTRO10' then 0.10 when 'CHEF20' then 0.20 else null end;
    if v_desc is null then
      perform public.gm_fail(422, 'Cupom inválido.');
    end if;
    v_valor := round(v_price * (1 - v_desc), 2);
  end if;
  v_type := p_data->>'type';
  v_chef := coalesce(p_data->>'chefId', '');
  v_ref := coalesce(p_data->>'refId', '');
  if v_type is null or v_type not in ('receita', 'assinatura', 'kit') then
    perform public.gm_fail(422, 'Tipo de compra inválido.');
  end if;
  if v_type = 'kit' then
    if coalesce(p_data->>'termo', '') <> 'true' then
      perform public.gm_fail(422, 'É obrigatório aceitar as normas da Vigilância Sanitária para prosseguir.');
    end if;
    if coalesce(p_data->>'entrega', '') <> 'retirada' then
      v_dist := public.gm_distance_km(coalesce(p_data->>'cep', ''), v_chef);
      if v_dist is null then
        perform public.gm_fail(422, 'Informe um CEP válido.');
      end if;
      select raio_entrega_km into v_raio from public.criador_conteudo where chef_id = v_chef;
      if v_dist > coalesce(v_raio, 5) then
        perform public.gm_fail(422, 'Endereço fora do raio de entrega. Escolha retirar no estabelecimento.');
      end if;
    end if;
  end if;
  v_metodo := case when p_data->>'metodo' = 'pix' then 'pix' else 'cartao' end;
  v_recusado := v_metodo = 'cartao' and coalesce(p_data->>'card_ok', '') <> 'true';

  insert into public.transacao_financeira (id_usuario, tipo, ref_id, chef_id, valor, metodo, cupom, status, http)
  values (u.id, v_type, v_ref, v_chef, v_valor, v_metodo, coalesce(p_data->>'cupom', ''),
          case when v_recusado then 'RECUSADA' else 'APROVADA' end, case when v_recusado then 402 else 200 end)
  returning id into v_tid;

  if v_recusado then
    -- não dá para usar "raise" aqui: ele desfaria o registro da transação recusada
    return jsonb_build_object('refused', true, 'tx', public.gm_tx_json(v_tid));
  end if;
  if v_type = 'receita' then
    insert into public.acesso_receita (id_usuario, id_receita, id_transacao) values (u.id, v_ref, v_tid)
    on conflict (id_usuario, id_receita) do nothing;
  elsif v_type = 'assinatura' then
    insert into public.assinatura (id_usuario, chef_id, id_transacao) values (u.id, v_chef, v_tid)
    on conflict (id_usuario, chef_id) do nothing;
  else
    insert into public.pedido_kit (id_usuario, id_receita, nome_receita, chef_id, valor, entrega, janela, cep)
    values (u.id, v_ref, coalesce(p_data->>'recipeName', ''), v_chef, v_valor, coalesce(p_data->>'entrega', 'entrega'),
            coalesce(p_data->>'slot', ''), coalesce(p_data->>'cep', ''))
    returning id into v_oid;
  end if;
  return jsonb_build_object('refused', false, 'tx', public.gm_tx_json(v_tid),
    'order', case when v_oid is null then null::jsonb else public.gm_order_json(v_oid) end);
end $$;

create or replace function public.gm_posts() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('posts', coalesce((select jsonb_agg(public.gm_post_json(po.id) order by po.id desc)
                                               from public.post_comunidade po), '[]'::jsonb))
$$;

create or replace function public.gm_post_create(p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.usuario; v_stars numeric; v_id bigint;
begin
  u := public.gm_need_user();
  if btrim(coalesce(p_data->>'caption', '')) = '' then
    perform public.gm_fail(422, 'Escreva um comentário antes de publicar.');
  end if;
  v_stars := public.gm_num(p_data->>'stars');
  if v_stars is null or v_stars < 0 or v_stars > 5 then
    perform public.gm_fail(422, 'Nota inválida.');
  end if;
  insert into public.post_comunidade (id_usuario, id_receita, chef_id, legenda, estrelas, imagem)
  values (u.id, coalesce(p_data->>'recipeId', ''), coalesce(p_data->>'chefId', ''), btrim(p_data->>'caption'),
          round(v_stars)::int, nullif(p_data->>'img', ''))
  returning id into v_id;
  return jsonb_build_object('post', public.gm_post_json(v_id));
end $$;

create or replace function public.gm_post_reply(p_id bigint, p_text text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c public.criador_conteudo; po public.post_comunidade;
begin
  c := public.gm_need_approved();
  select * into po from public.post_comunidade where id = p_id;
  if po.id is null then
    perform public.gm_fail(404, 'Post não encontrado.');
  end if;
  if po.chef_id <> c.chef_id then
    perform public.gm_fail(403, 'Você só responde dúvidas das suas receitas.');
  end if;
  if btrim(coalesce(p_text, '')) = '' then
    perform public.gm_fail(422, 'Escreva a resposta.');
  end if;
  update public.post_comunidade set resposta = btrim(p_text), respondido_por = c.chef_id where id = po.id;
  return jsonb_build_object('post', public.gm_post_json(po.id));
end $$;

create or replace function public.gm_dashboard() returns jsonb
language plpgsql security definer set search_path = public as $$
declare u public.usuario; c public.criador_conteudo; v_ok boolean;
begin
  u := public.gm_need_user();
  select * into c from public.criador_conteudo where id_usuario = u.id;
  if c.id is null then
    perform public.gm_fail(403, 'Esta conta não é de criador.');
  end if;
  v_ok := c.status_validacao = 'APROVADO';
  return jsonb_build_object(
    'creator', public.gm_j_creator(c),
    'recipes', case when v_ok then coalesce((select jsonb_agg(public.gm_recipe_json(r.id) order by r.id)
                                             from public.receita r where r.id_criador = c.id), '[]'::jsonb) else '[]'::jsonb end,
    'orders', case when v_ok then coalesce((select jsonb_agg(public.gm_order_json(o.id) order by o.id desc)
                                            from public.pedido_kit o where o.chef_id = c.chef_id), '[]'::jsonb) else '[]'::jsonb end,
    'tx', case when v_ok then coalesce((select jsonb_agg(public.gm_tx_json(t.id) order by t.id)
                                        from public.transacao_financeira t
                                        where t.chef_id = c.chef_id and t.status = 'APROVADA'), '[]'::jsonb) else '[]'::jsonb end,
    'posts', case when v_ok then coalesce((select jsonb_agg(public.gm_post_json(po.id) order by po.id desc)
                                           from public.post_comunidade po where po.chef_id = c.chef_id), '[]'::jsonb) else '[]'::jsonb end,
    'subs', (select count(*) from public.assinatura s where s.chef_id = c.chef_id));
end $$;

create or replace function public.gm_creator_radius(p_raio numeric) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c public.criador_conteudo;
begin
  c := public.gm_need_approved();
  if p_raio is null or p_raio < 1 or p_raio > 15 then
    perform public.gm_fail(422, 'O raio de entrega deve ficar entre 1 e 15 km.');
  end if;
  update public.criador_conteudo set raio_entrega_km = p_raio where id = c.id;
  select * into c from public.criador_conteudo where id = c.id;
  return jsonb_build_object('creator', public.gm_j_creator(c));
end $$;

create or replace function public.gm_order_status(p_id bigint, p_status text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c public.criador_conteudo; o public.pedido_kit;
begin
  c := public.gm_need_approved();
  select * into o from public.pedido_kit where id = p_id and chef_id = c.chef_id;
  if o.id is null then
    perform public.gm_fail(404, 'Pedido não encontrado.');
  end if;
  if p_status is null or p_status not in ('AGUARDANDO', 'CONFIRMADO', 'ENTREGUE') then
    perform public.gm_fail(422, 'Status inválido.');
  end if;
  update public.pedido_kit set status = p_status where id = o.id;
  return jsonb_build_object('order', public.gm_order_json(o.id));
end $$;

create or replace function public.gm_admin_overview() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.gm_need_admin();
  return jsonb_build_object(
    'creators', coalesce((select jsonb_agg(public.gm_j_creator(c) || jsonb_build_object('user', public.gm_j_user(us)) order by c.id)
                          from public.criador_conteudo c join public.usuario us on us.id = c.id_usuario), '[]'::jsonb),
    'users', coalesce((select jsonb_agg(public.gm_j_user(us) order by us.criado_em, us.email) from public.usuario us), '[]'::jsonb),
    'tx', coalesce((select jsonb_agg(public.gm_tx_json(t.id) order by t.id) from public.transacao_financeira t), '[]'::jsonb),
    'recipes', coalesce((select jsonb_agg(public.gm_recipe_json(r.id) order by r.id) from public.receita r), '[]'::jsonb));
end $$;

create or replace function public.gm_admin_creator(p_id bigint, p_acao text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c public.criador_conteudo;
begin
  perform public.gm_need_admin();
  select * into c from public.criador_conteudo where id = p_id;
  if c.id is null then
    perform public.gm_fail(404, 'Criador não encontrado.');
  end if;
  update public.criador_conteudo set status_validacao = case when p_acao = 'approve' then 'APROVADO' else 'REJEITADO' end
  where id = c.id;
  select * into c from public.criador_conteudo where id = c.id;
  return jsonb_build_object('creator', public.gm_j_creator(c));
end $$;

-- ---------------------------------------------------------------------
-- 6) PERMISSÕES: só as funções da API ficam acessíveis ao site
-- ---------------------------------------------------------------------
do $$
declare
  r record;
  api_fns text[] := array['gm_ping','gm_me','gm_update_name','gm_recipes','gm_recipe_create','gm_recipe_update',
    'gm_recipe_delete','gm_checkout','gm_posts','gm_post_create','gm_post_reply','gm_dashboard',
    'gm_creator_radius','gm_order_status','gm_admin_overview','gm_admin_creator','gm_delete_account'];
begin
  for r in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'gm\_%'
  loop
    if r.proname = any (api_fns) then
      execute format('revoke all on function %s from public', r.sig);
      execute format('grant execute on function %s to anon, authenticated', r.sig);
    else
      execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7) DADOS INICIAIS: os 8 restaurantes parceiros do catálogo base
-- ---------------------------------------------------------------------
insert into public.criador_conteudo (chef_id, nome_publico, tipo_perfil, documento_path, status_validacao, termo_sanitario_aceito, raio_entrega_km)
values
  ('torino',  'Osteria Torino',     'restaurante', 'cnpj_torino.pdf',  'APROVADO', true, 5),
  ('renato',  'Chef Renato Aveiro', 'restaurante', 'cnpj_renato.pdf',  'APROVADO', true, 8),
  ('siam',    'Casa Siam',          'restaurante', 'cnpj_siam.pdf',    'APROVADO', true, 6),
  ('bosque',  'Padaria do Bosque',  'restaurante', 'cnpj_bosque.pdf',  'APROVADO', true, 4),
  ('lume',    'Confeitaria Lume',   'restaurante', 'cnpj_lume.pdf',    'APROVADO', true, 5),
  ('recanto', 'Recanto Mineiro',    'restaurante', 'cnpj_recanto.pdf', 'APROVADO', true, 6),
  ('bufalo',  'Búfalo Burgers',     'restaurante', 'cnpj_bufalo.pdf',  'APROVADO', true, 5),
  ('verde',   'Verde Vivo',         'restaurante', 'cnpj_verde.pdf',   'APROVADO', true, 4)
on conflict (chef_id) do nothing;

-- avisa a API do Supabase para reconhecer as funções novas
notify pgrst, 'reload schema';
