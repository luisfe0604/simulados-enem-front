import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
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
  CartesianGrid
} from "recharts";
import styles from "./AdminDashboard.module.css";

const COLORS = ["var(--primary)", "#22c55e", "#ef4444"];

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/users/metrics");
        setData(res);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  if (!data) return <p>Carregando...</p>;

  function CustomPieTooltip({ active, payload }) {
    if (active && payload && payload.length) {
      const data = payload[0];

      return (
        <div
          style={{
            background: "var(--card-bg)",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
          }}
        >
          <strong>{data.name}</strong>
          <p>{data.value} usuários</p>
        </div>
      );
    }

    return null;
  }

  function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            borderRadius: "10px",
            padding: "10px 12px",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted-text)" }}>
            {label}
          </p>

          <p style={{ margin: 0, fontWeight: 600 }}>
            {payload[0].value} novos usuários
          </p>
        </div>
      );
    }

    return null;
  }

  const pieData = [
    { name: "Ativos", value: data.status.active },
    { name: "Teste Grátis", value: data.status.trialing || data.status.trial },
    { name: "Cancelados", value: data.status.canceled },
  ].filter((item) => item.value > 0);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard Admin</h1>

      {/* 🔥 CARDS */}
      <div className={styles.cards}>
        <Card title="Usuários" value={data.total_users} />
        <Card title="Pagantes" value={data.status.active} />
        <Card title="Trial" value={data.status.trialing} />
        <Card title="Cancelados" value={data.status.canceled} />
      </div>

      {/* 📈 GRÁFICOS */}
      <div className={styles.charts}>
        {/* crescimento */}
        <div className={styles.chartCard}>
          <h3>Crescimento de Usuários</h3>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data.users_growth}>
              {/* grid suave */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-color)"
                opacity={0.3}
              />

              {/* eixo X */}
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--muted-text)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              {/* eixo Y */}
              <YAxis
                tick={{ fill: "var(--muted-text)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              {/* tooltip custom */}
              <Tooltip content={<CustomTooltip />} />

              {/* legenda */}
              <Legend wrapperStyle={{ color: "var(--text-color)" }} />

              {/* linha */}
              <Line
                type="monotone"
                dataKey="count"
                name="Usuários"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* pizza */}
        <div className={styles.chartCard}>
          <h3>Status das Assinaturas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>

              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className={styles.card}>
      <span className={styles.cardTitle}>{title}</span>
      <span className={styles.cardValue}>{value}</span>
    </div>
  );
}
