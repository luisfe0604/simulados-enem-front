// Cliente de API para uso em client components. Substitui o apiFetch antigo
// (que mandava o token do localStorage no header). Agora as rotas são de mesma
// origem (/api/...) e o cookie httpOnly é enviado automaticamente — sem header
// Authorization, sem token no JS.

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = "Erro na requisição";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // resposta sem corpo JSON
    }
    throw new ApiError(message, res.status);
  }

  // 204 / corpo vazio
  if (res.status === 204) return undefined as T;

  return res.json();
}
