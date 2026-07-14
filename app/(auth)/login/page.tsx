"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/client-api";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // O cookie httpOnly já foi setado pelo servidor. Navega para o destino.
      router.replace(redirect);
      router.refresh();
    } catch {
      setError("Credenciais inválidas");
      setLoading(false);
    }
  }

  function loginWithGoogle() {
    window.location.href = "/api/users/auth/google?system=enem";
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-text-primary">Bem-vindo de volta</h1>
      <p className="mt-1 text-sm text-text-muted">
        Entre para continuar seus simulados
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-text-primary">Email</label>
          <input
            type="email"
            placeholder="seuemail@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-text-primary">Senha</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-block"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border-soft" />
        OU
        <span className="h-px flex-1 bg-border-soft" />
      </div>

      <Link href="/register" className="btn btn-outline btn-block">
        Criar conta
      </Link>

      <button
        onClick={loginWithGoogle}
        className="btn btn-outline btn-block mt-3"
      >
        <GoogleIcon />
        Continuar com Google
      </button>
    </>
  );
}

// Marca oficial do Google (multicolor) inline — evita a dependência externa que
// antes carregava o SVG por URL. As cores aqui são do logo do fornecedor, não
// cores de destaque do sistema; ficam de fora da paleta por serem uma marca.
function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
