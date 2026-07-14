"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { apiFetch } from "@/lib/client-api";

interface Metrics {
  total_users: number;
  status: { active: number; trialing: number; trial?: number; canceled: number };
  users_growth: { month: string; count: number }[];
  subscriptions_growth: { month: string; count: number }[];
}

// Cores dos gráficos alinhadas à paleta do sistema (primary / success / danger).
const COLORS = ["#2563eb", "#16a34a", "#dc2626"];

export default function AdminDashboardClient() {
  const [data, setData] = useState<Metrics | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<Metrics>("/users/metrics");
        setData(res);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  if (!data) return <p className="text-text-muted">Carregando...</p>;

  const pieData = [
    { name: "Ativos", value: data.status.active },
    { name: "Teste Grátis", value: data.status.trialing || data.status.trial || 0 },
    { name: "Cancelados", value: data.status.canceled },
  ].filter((item) => item.value > 0);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 text-2xl font-bold text-text-primary">Dashboard Admin</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card title="Usuários" value={data.total_users} />
        <Card title="Pagantes" value={data.status.active} />
        <Card title="Trial" value={data.status.trialing} />
        <Card title="Cancelados" value={data.status.canceled} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 font-semibold text-text-primary">
            Crescimento de Usuários
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data.users_growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="Usuários"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 font-semibold text-text-primary">
            Status das Assinaturas
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="eyebrow">{title}</p>
      <p className="mt-2 font-mono text-3xl font-bold text-text-primary tabular-nums">
        {value}
      </p>
    </div>
  );
}
