import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import { Loader2, TrendingUp, TrendingDown, Package, ShoppingCart, AlertCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart, Area
} from 'recharts';

const COLORS = ['#1e3a8a', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

// ── Small helper ─────────────────────────────────────────
function pctChange(current: number, previous: number) {
  if (!previous) return null;
  const pct = ((current - previous) / previous) * 100;
  return pct;
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const pct = pctChange(current, previous);
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${up ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(pct).toFixed(1)}% vs last month
    </span>
  );
}

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'inventory' | 'financial'>('overview');

  useEffect(() => {
    axiosService('get', '/analytics')
      .then(setData)
      .catch(() => toast({ title: "Error", description: "Failed to load analytics.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!data) return null;

  const { totals, this_month, last_month, monthly_revenue, profit_trend,
    top_clients_alltime, top_clients_weight, order_status,
    price_trend, supplier_costs, inventory, outstanding } = data;

  const stockPercent = Number(inventory.total_purchased) > 0
    ? (Number(inventory.current_stock) / Number(inventory.total_purchased)) * 100
    : 0;

  // Enrich profit trend with profit field
  const profitData = (profit_trend || []).map((r: any) => ({
    ...r,
    profit: Number(r.revenue) - Number(r.cost),
    revenue: Number(r.revenue),
    cost: Number(r.cost),
  }));

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'clients', label: 'Clients' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'financial', label: 'Financial' },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">Business performance at a glance</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 border-b pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "This Month's Revenue",
                value: `GH₵ ${Number(this_month.revenue).toLocaleString()}`,
                sub: <TrendBadge current={Number(this_month.revenue)} previous={Number(last_month.revenue)} />,
                icon: TrendingUp, color: 'bg-primary/10', iconColor: 'text-primary'
              },
              {
                label: "This Month's Orders",
                value: this_month.orders,
                sub: <TrendBadge current={Number(this_month.orders)} previous={Number(last_month.orders)} />,
                icon: ShoppingCart, color: 'bg-accent/10', iconColor: 'text-accent'
              },
              {
                label: "This Month's Weight",
                value: `${Number(this_month.weight).toLocaleString()} kg`,
                sub: <TrendBadge current={Number(this_month.weight)} previous={Number(last_month.weight)} />,
                icon: Package, color: 'bg-success/10', iconColor: 'text-success'
              },
              {
                label: 'Stock Remaining',
                value: `${Number(inventory.current_stock).toLocaleString()} kg`,
                sub: <span className="text-xs text-muted-foreground">{stockPercent.toFixed(1)}% of purchased</span>,
                icon: Package, color: 'bg-warning/10', iconColor: 'text-warning'
              },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold mt-1">{s.value}</p>
                      <div className="mt-2">{s.sub}</div>
                    </div>
                    <div className={`p-2 rounded-xl ${s.color} shrink-0`}>
                      <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* All-time summary row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'All-time Revenue', value: `GH₵ ${Number(totals.total_revenue).toLocaleString()}` },
              { label: 'All-time Orders', value: totals.total_orders },
              { label: 'All-time Weight Sold', value: `${Number(totals.total_weight).toLocaleString()} kg` },
              { label: 'Avg Order Value', value: `GH₵ ${Number(totals.avg_order_value).toLocaleString()}` },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold mt-0.5">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly Revenue Bar + Orders Line */}
          <Card>
            <CardHeader><CardTitle>Monthly Revenue & Orders (Last 12 Months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthly_revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `GH₵${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number, name: string) =>
                    name === 'revenue' ? `GH₵ ${v.toLocaleString()}` : v
                  } />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#1e3a8a" radius={[4,4,0,0]} name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="order_count" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Orders" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Breakdown */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Orders by Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={order_status}
                      cx="50%" cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="status"
                      label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {order_status.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, 'Orders']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {order_status.map((s: any, i: number) => (
                    <div key={s.status} className="text-center p-3 rounded-lg bg-muted">
                      <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: COLORS[i % COLORS.length] }} />
                      <p className="text-lg font-bold">{s.count}</p>
                      <p className="text-xs text-muted-foreground">{s.status}</p>
                      <p className="text-xs text-muted-foreground">GH₵ {Number(s.value).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Outstanding balances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Outstanding Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                {outstanding.length > 0 ? (
                  <div className="space-y-3">
                    {outstanding.map((c: any) => {
                      const balance = Number(c.total_billed) - Number(c.total_paid);
                      const pct = Number(c.total_billed) > 0
                        ? (Number(c.total_paid) / Number(c.total_billed)) * 100 : 0;
                      return (
                        <Link key={c.id} to={`/clients/${c.id}`} className="block">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{c.name}</span>
                            <span className="text-destructive font-bold text-sm">GH₵ {balance.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{pct.toFixed(0)}% paid of GH₵ {Number(c.total_billed).toLocaleString()}</p>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
                    <p>All clients are fully paid up!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── CLIENTS TAB ──────────────────────────────── */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top clients by revenue pie */}
            <Card>
              <CardHeader><CardTitle>Top Clients by Revenue (This Month)</CardTitle></CardHeader>
              <CardContent>
                {top_clients_weight.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={top_clients_weight}
                        cx="50%" cy="50%"
                        outerRadius={100}
                        dataKey="total_revenue"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {top_clients_weight.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `GH₵ ${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No orders this month yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Top clients by weight bar */}
            <Card>
              <CardHeader><CardTitle>Top Clients by Weight (This Month)</CardTitle></CardHeader>
              <CardContent>
                {top_clients_weight.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={top_clients_weight} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}kg`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip formatter={(v: number) => `${v} kg`} />
                      <Bar dataKey="total_weight" radius={[0, 4, 4, 0]}>
                        {top_clients_weight.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No orders this month yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All-time client rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> All-Time Client Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Client</th>
                      <th>Orders</th>
                      <th>Weight</th>
                      <th>Revenue</th>
                      <th>Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top_clients_alltime.map((c: any, i: number) => (
                      <tr key={c.id}>
                        <td>
                          <span className={`font-bold text-lg ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td>
                          <Link to={`/clients/${c.id}`} className="font-semibold hover:text-primary hover:underline">
                            {c.name}
                          </Link>
                        </td>
                        <td>{c.total_orders}</td>
                        <td>{Number(c.total_weight).toLocaleString()} kg</td>
                        <td className="font-semibold text-success">GH₵ {Number(c.total_revenue).toLocaleString()}</td>
                        <td className="text-muted-foreground text-sm">
                          {c.last_order ? new Date(c.last_order).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── INVENTORY TAB ────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Stock overview cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Purchased', value: `${Number(inventory.total_purchased).toLocaleString()} kg`, color: 'text-foreground' },
              { label: 'Total Sold', value: `${Number(inventory.total_sold).toLocaleString()} kg`, color: 'text-success' },
              { label: 'Current Stock', value: `${Number(inventory.current_stock).toLocaleString()} kg`, color: Number(inventory.current_stock) < 100 ? 'text-destructive' : 'text-primary' },
              { label: 'Total Cost of Stock', value: `GH₵ ${Number(inventory.total_cost).toLocaleString()}`, color: 'text-accent' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stock progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Stock Utilisation</span>
                <span className="text-muted-foreground">
                  {(100 - stockPercent).toFixed(1)}% sold — {stockPercent.toFixed(1)}% remaining
                </span>
              </div>
              <div className="h-5 bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-primary rounded-l-full transition-all"
                  style={{ width: `${100 - stockPercent}%` }}
                />
                <div
                  className="h-full bg-success/40 rounded-r-full transition-all"
                  style={{ width: `${stockPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Sold</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success/40 inline-block" /> Remaining</span>
              </div>
            </CardContent>
          </Card>

          {/* Supplier cost breakdown */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Cost by Supplier</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={supplier_costs}
                      cx="50%" cy="50%"
                      outerRadius={90}
                      dataKey="total_cost"
                      nameKey="supplier_name"
                      label={({ supplier_name, percent }) => `${supplier_name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {supplier_costs.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `GH₵ ${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Supplier Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supplier_costs.map((s: any, i: number) => (
                    <div key={s.supplier_name} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{s.supplier_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(s.total_weight).toLocaleString()} kg across {s.total_cycles} cycle{s.total_cycles !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="font-bold text-sm">GH₵ {Number(s.total_cost).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── FINANCIAL TAB ────────────────────────────── */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* Profit trend */}
          <Card>
            <CardHeader><CardTitle>Revenue vs Cost vs Profit (Last 12 Months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `GH₵${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `GH₵ ${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1e3a8a" radius={[4,4,0,0]} name="Revenue" opacity={0.85} />
                  <Bar dataKey="cost" fill="#ef4444" radius={[4,4,0,0]} name="Cost" opacity={0.85} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Profit" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Profit summary cards */}
          {profitData.length > 0 && (() => {
            const totalRev = profitData.reduce((s: number, r: any) => s + r.revenue, 0);
            const totalCost = profitData.reduce((s: number, r: any) => s + r.cost, 0);
            const totalProfit = totalRev - totalCost;
            const margin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
            const bestMonth = [...profitData].sort((a: any, b: any) => b.profit - a.profit)[0];
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue (12m)', value: `GH₵ ${totalRev.toLocaleString()}`, color: 'text-primary' },
                  { label: 'Total Cost (12m)', value: `GH₵ ${totalCost.toLocaleString()}`, color: 'text-destructive' },
                  { label: 'Total Profit (12m)', value: `GH₵ ${totalProfit.toLocaleString()}`, color: totalProfit >= 0 ? 'text-success' : 'text-destructive' },
                  { label: 'Profit Margin', value: `${margin.toFixed(1)}%`, color: margin >= 20 ? 'text-success' : margin >= 10 ? 'text-warning' : 'text-destructive' },
                ].map(s => (
                  <Card key={s.label}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}

          {/* Avg price per kg trend */}
          <Card>
            <CardHeader><CardTitle>Average Price per kg Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={price_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `GH₵${v}`} />
                  <Tooltip formatter={(v: number) => `GH₵ ${Number(v).toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="avg_price" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Avg Price/kg" />
                  <Line type="monotone" dataKey="avg_order_weight" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Avg Order Weight (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Outstanding balances full table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                All Outstanding Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {outstanding.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Total Billed</th>
                        <th>Total Paid</th>
                        <th>Balance Due</th>
                        <th>% Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstanding.map((c: any) => {
                        const balance = Number(c.total_billed) - Number(c.total_paid);
                        const pct = Number(c.total_billed) > 0
                          ? (Number(c.total_paid) / Number(c.total_billed)) * 100 : 0;
                        return (
                          <tr key={c.id}>
                            <td>
                              <Link to={`/clients/${c.id}`} className="font-semibold hover:text-primary hover:underline">
                                {c.name}
                              </Link>
                            </td>
                            <td>GH₵ {Number(c.total_billed).toLocaleString()}</td>
                            <td className="text-success">GH₵ {Number(c.total_paid).toLocaleString()}</td>
                            <td className="text-destructive font-bold">GH₵ {balance.toLocaleString()}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <span className="text-sm">{pct.toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
                  <p>No outstanding balances — all clients are fully paid up!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}