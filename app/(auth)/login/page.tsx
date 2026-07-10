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
      <h1 className="text-center text-2xl font-bold text-primary">NexAprova</h1>
      <p className="mt-1 text-center text-sm text-text-muted">
        Acesse sua conta para continuar
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
            className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-text-primary outline-none focus:border-focus"
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
            className="w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-text-primary outline-none focus:border-focus"
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
          className="w-full rounded-lg bg-primary py-2 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border-soft" />
        OU
        <span className="h-px flex-1 bg-border-soft" />
      </div>

      <Link
        href="/register"
        className="block w-full rounded-lg border border-border py-2 text-center font-medium text-text-primary transition-colors hover:bg-bg-hover"
      >
        Criar conta
      </Link>

      <button
        onClick={loginWithGoogle}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 font-medium text-text-primary transition-colors hover:bg-bg-hover"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          className="h-5 w-5"
        />
        Continuar com Google
      </button>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
