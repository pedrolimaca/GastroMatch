-- Esquema relacional do GastroMatch (baseado no DER v2.0).
-- SQLite por padrão; os tipos são simples e portáveis para PostgreSQL/Supabase
-- (trocar INTEGER PRIMARY KEY AUTOINCREMENT por SERIAL/IDENTITY).
CREATE TABLE IF NOT EXISTS usuario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('amador','criador','admin')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS criador_conteudo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER REFERENCES usuario(id) ON DELETE CASCADE,
  chef_id TEXT NOT NULL UNIQUE,
  nome_publico TEXT,
  tipo_perfil TEXT NOT NULL DEFAULT 'chef',
  documento_path TEXT,
  status_validacao TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status_validacao IN ('PENDENTE','APROVADO','REJEITADO')),
  termo_sanitario_aceito INTEGER NOT NULL DEFAULT 0,
  raio_entrega_km REAL NOT NULL DEFAULT 5 CHECK (raio_entrega_km BETWEEN 1 AND 15)
);
CREATE TABLE IF NOT EXISTS receita (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_criador INTEGER NOT NULL REFERENCES criador_conteudo(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  instrucoes TEXT NOT NULL DEFAULT '[]',
  ingredientes TEXT NOT NULL DEFAULT '[]',
  categoria_restricao TEXT NOT NULL DEFAULT 'sem restrição',
  categoria TEXT NOT NULL DEFAULT 'alta',
  tempo_preparo_min INTEGER NOT NULL CHECK (tempo_preparo_min > 0),
  preco REAL NOT NULL CHECK (preco > 0),
  link_videoaula TEXT NOT NULL DEFAULT '',
  imagem TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO','PUBLICADA')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS kit_ingrediente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_receita INTEGER NOT NULL UNIQUE REFERENCES receita(id) ON DELETE CASCADE,
  composicao TEXT NOT NULL DEFAULT '',
  valor_kit REAL NOT NULL CHECK (valor_kit >= 0)
);
CREATE TABLE IF NOT EXISTS transacao_financeira (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita','assinatura','kit')),
  ref_id TEXT NOT NULL,
  chef_id TEXT NOT NULL,
  valor REAL NOT NULL,
  metodo TEXT NOT NULL,
  cupom TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('APROVADA','RECUSADA')),
  http INTEGER NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS acesso_receita (
  id_usuario INTEGER NOT NULL REFERENCES usuario(id),
  id_receita TEXT NOT NULL,
  id_transacao INTEGER REFERENCES transacao_financeira(id),
  PRIMARY KEY (id_usuario, id_receita)
);
CREATE TABLE IF NOT EXISTS assinatura (
  id_usuario INTEGER NOT NULL REFERENCES usuario(id),
  chef_id TEXT NOT NULL,
  id_transacao INTEGER REFERENCES transacao_financeira(id),
  PRIMARY KEY (id_usuario, chef_id)
);
CREATE TABLE IF NOT EXISTS pedido_kit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id),
  id_receita TEXT NOT NULL,
  nome_receita TEXT NOT NULL,
  chef_id TEXT NOT NULL,
  valor REAL NOT NULL,
  entrega TEXT NOT NULL,
  janela TEXT NOT NULL DEFAULT '',
  cep TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'AGUARDANDO' CHECK (status IN ('AGUARDANDO','CONFIRMADO','ENTREGUE')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS post_comunidade (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id),
  id_receita TEXT NOT NULL,
  chef_id TEXT NOT NULL DEFAULT '',
  legenda TEXT NOT NULL,
  estrelas INTEGER NOT NULL CHECK (estrelas BETWEEN 0 AND 5),
  imagem TEXT,
  resposta TEXT NOT NULL DEFAULT '',
  respondido_por TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_receita_status ON receita(status);
CREATE INDEX IF NOT EXISTS idx_tx_chef ON transacao_financeira(chef_id);
CREATE INDEX IF NOT EXISTS idx_pedido_chef ON pedido_kit(chef_id);
CREATE INDEX IF NOT EXISTS idx_post_chef ON post_comunidade(chef_id);
