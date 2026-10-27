/* Configuração do front. GM_API_BASE:
   null     -> detecta sozinho: se existir /api no mesmo endereço (npm start), usa o banco de dados; senão usa o modo local (navegador).
   'https://seu-servidor.com/api' -> força um back-end hospedado em outro endereço. */
window.GM_API_BASE = null;
