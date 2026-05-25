'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { MonthlyPoint } from '../../../../types/finance';
import { INCOME_SOURCE_LABELS, EXPENSE_CATEGORY_LABELS } from '../../../../types/finance';

const fmt = (v: number) => `${Number(v).toLocaleString('ru-RU')} сом`;

function monthLabel(month: string): string {
  // "2026-05" -> "05.2026"
  const [y, m] = month.split('-');
  return `${m}.${y}`;
}

const tooltipStyle: React.CSSProperties = {
  background: 'var(--card, #fff)',
  border: '1px solid var(--border, #e5e7eb)',
  borderRadius: 8,
  color: 'var(--foreground, #111)',
  fontSize: 12,
};

export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  const chartData = data.map((d) => ({
    month: monthLabel(d.month),
    Доход: d.income,
    Расход: d.expense,
    Прибыль: d.profit,
  }));

  if (chartData.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Нет данных за период</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="rgba(128,128,128,0.6)" />
        <YAxis tick={{ fontSize: 12 }} stroke="rgba(128,128,128,0.6)" width={70} />
        <Tooltip formatter={(value) => fmt(Number(value) || 0)} contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Доход" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={18} />
        <Bar dataKey="Расход" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={18} />
        <Line type="monotone" dataKey="Прибыль" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

const INCOME_COLORS: Record<string, string> = {
  market: '#22c55e',
  subscription: '#0ea5e9',
  manual: '#a78bfa',
};

const EXPENSE_COLORS: Record<string, string> = {
  server: '#ef4444',
  materials: '#f97316',
  salary: '#eab308',
  rent: '#8b5cf6',
  tax: '#ec4899',
  other: '#94a3b8',
};

function BreakdownPie({
  data,
  colors,
  emptyText,
}: {
  data: { name: string; value: number; key: string }[];
  colors: Record<string, string>;
  emptyText: string;
}) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">{emptyText}</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={45}
          paddingAngle={2}
          label={(entry) => `${(entry as { name: string }).name}`}
          labelLine={false}
        >
          {filtered.map((entry) => (
            <Cell key={entry.key} fill={colors[entry.key] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => fmt(Number(value) || 0)} contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function IncomeSourcePie({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data).map(([key, value]) => ({
    key,
    name: INCOME_SOURCE_LABELS[key as keyof typeof INCOME_SOURCE_LABELS] || key,
    value,
  }));
  return <BreakdownPie data={items} colors={INCOME_COLORS} emptyText="Нет доходов за период" />;
}

export function ExpenseCategoryPie({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data).map(([key, value]) => ({
    key,
    name: EXPENSE_CATEGORY_LABELS[key as keyof typeof EXPENSE_CATEGORY_LABELS] || key,
    value,
  }));
  return <BreakdownPie data={items} colors={EXPENSE_COLORS} emptyText="Нет расходов за период" />;
}
