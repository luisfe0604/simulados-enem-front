import { Pool, type QueryResult, type QueryResultRow, type PoolClient } from "pg";

// Em serverless (Vercel) cada instância da função reaproveita o mesmo Pool
// entre invocações. Guardamos no globalThis para não criar um Pool novo a cada
// hot-reload em dev. A criação é LAZY: só acontece na primeira query, para não
// falhar durante `next build` (quando DATABASE_URL não está no ambiente).
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function getPool(): Pool {
  if (globalForDb.pgPool) return globalForDb.pgPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada");
  }

  const pool = new Pool({
    connectionString,
    // NÃO forçamos SSL: este banco não suporta SSL (o backend antigo conecta
    // sem nenhuma opção de ssl). Deixamos o `pg` respeitar o sslmode da própria
    // connection string — assim funciona onde o backend funciona. Se algum
    // ambiente exigir SSL, basta acrescentar ?sslmode=require na DATABASE_URL.
    max: 5,
    idleTimeoutMillis: 30_000,
  });

  globalForDb.pgPool = pool;
  return pool;
}

// Wrapper com a mesma API usada pelos serviços (pool.query / pool.connect),
// mas resolvendo o Pool preguiçosamente.
const db = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return getPool().query<T>(text, params as never);
  },
  connect(): Promise<PoolClient> {
    return getPool().connect();
  },
};

export default db;
