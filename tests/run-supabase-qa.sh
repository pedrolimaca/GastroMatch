#!/usr/bin/env bash
# Cria serviços locais descartáveis e executa o adaptador contra Auth e PostgREST reais.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

run_id="gm-sprint3-qa-$$-${RANDOM}"
db="${run_id}-db"
auth="${run_id}-auth"
rest="${run_id}-rest"
secret="$(openssl rand -hex 32)"
db_password="$(openssl rand -hex 16)"
admin_password="$(openssl rand -hex 16)"
admin_email='admin-gm-qa@example.org'

docker network create "$run_id" >/dev/null
trap 'docker rm -f "$rest" "$auth" "$db" >/dev/null 2>&1 || true; docker network rm "$run_id" >/dev/null 2>&1 || true' EXIT
docker run -d --name "$db" --network "$run_id" -e POSTGRES_PASSWORD="$db_password" postgres:16-alpine >/dev/null
for attempt in {1..30}; do
  docker exec "$db" pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1 && break
  sleep 1
done
docker exec -i "$db" psql -U postgres -v ON_ERROR_STOP=1 -q <<'SQL'
create schema auth;
alter role postgres in database postgres set search_path to auth, public;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create function auth.uid() returns uuid language sql stable
as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
SQL

database="postgres://postgres:${db_password}@${db}:5432/postgres?sslmode=disable"
docker run -d --name "$auth" --network "$run_id" -p 127.0.0.1::9999 \
  -e GOTRUE_API_HOST=0.0.0.0 -e GOTRUE_API_PORT=9999 -e API_EXTERNAL_URL=http://localhost \
  -e GOTRUE_DB_DRIVER=postgres -e GOTRUE_DB_NAMESPACE=auth -e GOTRUE_DB_DATABASE_URL="$database" \
  -e GOTRUE_SITE_URL=http://localhost -e GOTRUE_MAILER_AUTOCONFIRM=true -e GOTRUE_EXTERNAL_EMAIL_ENABLED=true \
  -e GOTRUE_JWT_SECRET="$secret" -e GOTRUE_JWT_AUD=authenticated \
  -e GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated -e GOTRUE_JWT_ADMIN_ROLES=service_role supabase/gotrue:v2.177.0 >/dev/null
auth_url="http://$(docker port "$auth" 9999/tcp)"
for attempt in {1..30}; do
  curl -fsS "$auth_url/health" >/dev/null 2>&1 && break
  if [ "$(docker inspect -f '{{.State.Running}}' "$auth")" != true ]; then
    docker logs --tail 8 "$auth" >&2
    exit 1
  fi
  sleep 1
done
curl -fsS "$auth_url/health" >/dev/null

docker exec -i "$db" psql -U postgres -q -v ON_ERROR_STOP=1 < server/supabase.sql
docker exec -i "$db" psql -U postgres -q -v ON_ERROR_STOP=1 < server/supabase.sql
printf '%s\n' 'PASS  Migração aplicada duas vezes no PostgreSQL com o esquema real do GoTrue.'
docker run -d --name "$rest" --network "$run_id" -p 127.0.0.1::3000 \
  -e PGRST_DB_URI="$database" -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_JWT_SECRET="$secret" postgrest/postgrest:v12.2.12 >/dev/null
rest_url="http://$(docker port "$rest" 3000/tcp)"
curl -fsS --retry 15 --retry-delay 1 --retry-connrefused -o /dev/null \
  -H 'Content-Type: application/json' --data '{}' "$rest_url/rpc/gm_ping"

printf '{"email":"%s","password":"%s","data":{"name":"Admin QA"}}' "$admin_email" "$admin_password" |
  curl -fsS -H 'Content-Type: application/json' --data-binary @- "$auth_url/signup" -o /dev/null
docker exec -i "$db" psql -U postgres -q -v ON_ERROR_STOP=1 -v admin_email="$admin_email" <<'SQL'
update public.usuario set perfil = 'admin' where email = :'admin_email';
SQL
GM_QA_AUTH="$auth_url" GM_QA_REST="$rest_url" GM_QA_ADMIN_EMAIL="$admin_email" \
  GM_QA_ADMIN_PASSWORD="$admin_password" node tests/sprint3-auth-integration.test.cjs
