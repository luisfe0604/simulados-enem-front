"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/client-api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/users/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      router.replace("/");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar conta";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-text-primary">Criar conta</h1>
      <p className="mt-1 text-sm text-text-muted">
        Comece seu teste gratuito de 7 dias após assinar
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-text-primary">Nome</label>
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input"
          />
        </div>

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
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
