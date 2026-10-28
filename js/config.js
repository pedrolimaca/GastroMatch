/* Configuração do front.

   SUPABASE (banco de dados na nuvem): preencha url e key para usar o Supabase.
   - url: https://SEU-PROJETO.supabase.co
   - key: a chave PÚBLICA (começa com sb_publishable_ ou "anon"). Ela pode ficar no site.
   NUNCA coloque aqui a chave secret / service_role: ela dá acesso total ao banco.
   Se o Supabase não responder (ou o script server/supabase.sql ainda não tiver sido
   rodado), o site continua funcionando em modo local. Para ver o modo ativo, abra o
   console do navegador e digite: API.mode()
   Para desligar o Supabase, deixe: window.GM_SUPABASE = null; */
window.GM_SUPABASE = {
  url: 'https://ajyuufoazywpgucaijbj.supabase.co',
  key: 'sb_publishable_O2nDRD4_Ob7zE5DtgNexPA_T8yr1tpb'
};

/* GM_API_BASE (servidor Node próprio, opcional; ignorado quando o Supabase está ativo):
   null     -> detecta sozinho: se existir /api no mesmo endereço (npm start), usa o banco SQLite; senão usa o modo local (navegador).
   'https://seu-servidor.com/api' -> força um back-end hospedado em outro endereço. */
window.GM_API_BASE = null;
