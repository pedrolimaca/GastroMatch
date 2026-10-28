-- =====================================================================
-- GastroMatch - contas de demonstração no Supabase
--
-- ORDEM: 1) rode server/supabase.sql
--        2) no SITE, crie estas contas pela tela "Criar conta":
--             admin@gastromatch.com   (senha admin123)   - tipo Cozinheiro
--             chef@gastromatch.com    (senha chef123)    - tipo Chef/Restaurante (qualquer arquivo no documento)
--             marina@email.com        (senha 123456)     - tipo Cozinheiro
--             beatriz@email.com       (senha 123456)     - tipo Chef/Restaurante (fica PENDENTE de propósito)
--        3) rode ESTE script (SQL Editor > New query > Run)
--
-- Ele promove o administrador e liga o chef de demonstração ao restaurante
-- "Osteria Torino". Pode rodar mais de uma vez.
-- =====================================================================

-- administrador (a regra de segurança impede alguém de se promover pelo site)
update public.usuario set perfil = 'admin', nome = 'Administração GastroMatch'
where email = 'admin@gastromatch.com';

-- chef de demonstração = dono do restaurante Osteria Torino (já aprovado)
do $$
declare v_uid uuid;
begin
  select id into v_uid from public.usuario where email = 'chef@gastromatch.com';
  if v_uid is not null then
    delete from public.criador_conteudo where id_usuario = v_uid and chef_id <> 'torino';
    update public.criador_conteudo set id_usuario = v_uid where chef_id = 'torino';
    update public.usuario set perfil = 'criador', nome = 'Osteria Torino' where id = v_uid;
  end if;
end $$;

-- beatriz fica como criadora pendente (para testar a curadoria)
update public.usuario set nome = 'Chef Beatriz Lima' where email = 'beatriz@email.com';
update public.criador_conteudo set nome_publico = 'Chef Beatriz Lima'
where id_usuario = (select id from public.usuario where email = 'beatriz@email.com');

-- uma dúvida de exemplo na comunidade (só se ainda não existir)
insert into public.post_comunidade (id_usuario, id_receita, chef_id, legenda, estrelas, resposta, respondido_por)
select u.id, 'tagliatelle-ragu', 'torino', 'Ficou idêntico ao do restaurante. Posso trocar o parmesão por pecorino?', 5,
       'Pode sim, Marina! Pecorino combina muito bem.', 'torino'
from public.usuario u
where u.email = 'marina@email.com'
  and not exists (select 1 from public.post_comunidade p where p.id_usuario = u.id and p.id_receita = 'tagliatelle-ragu');
