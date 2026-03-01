import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#1e3a8a', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function Analytics() {
  const { orders, clients, cycles, getClientById, getTotalRevenue } = useData();

  // Monthly revenue data
  const monthlyRevenue = orders.reduce((acc, order) => {
    const month = new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const existing = acc.find(item => item.month === month);
    const revenue = order.totalWeightKg * order.pricePerKg;
    if (existing) {
      existing.revenue += revenue;
      existing.orders += 1;
    } else {
      acc.push({ month, revenue, orders: 1 });
    }
    return acc;
  }, [] as { month: string; revenue: number; orders: number }[]);

  // Top clients by revenue
  const clientRevenue = clients.map(client => {
    const clientOrders = orders.filter(o => o.clientId === client.id);
    const revenue = clientOrders.reduce((sum, o) => sum + (o.totalWeightKg * o.pricePerKg), 0);
    const weight = clientOrders.reduce((sum, o) => sum + o.totalWeightKg, 0);
    return { name: client.name, revenue, weight, orders: clientOrders.length };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const totalRevenue = getTotalRevenue();
  const totalWeight = orders.reduce((sum, o) => sum + o.totalWeightKg, 0);
  const avgOrderSize = orders.length > 0 ? totalWeight / orders.length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-display font-bold">Analytics & Reports</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold text-primary">GH₵ {totalRevenue.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{orders.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Weight Sold</p><p className="text-2xl font-bold">{totalWeight.toLocaleString()} kg</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Avg Order Size</p><p className="text-2xl font-bold">{avgOrderSize.toFixed(1)} kg</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `GH₵ ${value.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Clients Pie Chart */}
        <Card>
          <CardHeader><CardTitle>Top Clients by Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={clientRevenue} cx="50%" cy="50%" outerRadius={100} dataKey="revenue" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {clientRevenue.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => `GH₵ ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card>
        <CardHeader><CardTitle>Client Rankings</CardTitle></CardHeader>
        <CardContent>
          <table className="data-table">
            <thead><tr><th>Rank</th><th>Client</th><th>Orders</th><th>Weight</th><th>Revenue</th></tr></thead>
            <tbody>
              {clientRevenue.map((client, i) => (
                <tr key={client.name}>
                  <td className="font-bold text-primary">#{i + 1}</td>
                  <td className="font-semibold">{client.name}</td>
                  <td>{client.orders}</td>
                  <td>{client.weight.toLocaleString()} kg</td>
                  <td className="font-semibold text-success">GH₵ {client.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
