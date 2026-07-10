import { Pool } from "pg";

// Em serverless (Vercel) cada instância da função reaproveita o mesmo Pool
// entre invocações. Guardamos no globalThis para não criar um Pool novo a cada
// hot-reload em dev nem a cada cold start reaproveitável em produção.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada");
  }

  return new Pool({
    connectionString,
    // O Postgres do backend antigo (Render/Supabase) exige SSL. O driver aceita
    // a conexão sem validar a cadeia de certificados, igual ao comportamento
    // padrão de provedores gerenciados.
    ssl: { rejectUnauthorized: false },
    // Limite baixo por instância: em serverless muitas instâncias compartilham
    // o mesmo banco, então poucas conexões por instância evita esgotar o limite.
    max: 5,
    idleTimeoutMillis: 30_000,
  });
}

const pool = globalForDb.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export default pool;
