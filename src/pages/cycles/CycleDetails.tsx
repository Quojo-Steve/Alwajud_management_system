import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { 
  ArrowLeft, 
  Calendar, 
  Package, 
  DollarSign, 
  User, 
  ShoppingCart,
  TrendingUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#1e3a8a', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function CycleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCycleById, getOrdersByCycle, getRemainingWeight, getClientById, closeCycle } = useData();

  const cycle = getCycleById(id || '');
  const orders = getOrdersByCycle(id || '');
  const remaining = getRemainingWeight(id || '');

  if (!cycle) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Cycle not found</h2>
        <Button onClick={() => navigate('/cycles')}>Back to Cycles</Button>
      </div>
    );
  }

  const usedWeight = cycle.totalWeightKg - remaining;
  const usedPercent = (usedWeight / cycle.totalWeightKg) * 100;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalWeightKg * o.pricePerKg), 0);
  const totalCost = cycle.totalWeightKg * cycle.costPerKg;
  const profit = totalRevenue - (usedWeight * cycle.costPerKg);

  // Client distribution data for pie chart
  const clientDistribution = orders.reduce((acc, order) => {
    const client = getClientById(order.clientId);
    const clientName = client?.name || 'Unknown';
    const existing = acc.find(item => item.name === clientName);
    if (existing) {
      existing.value += order.totalWeightKg;
    } else {
      acc.push({ name: clientName, value: order.totalWeightKg });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/cycles')}
            className="mb-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cycles
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {cycle.supplierName || `Cycle ${cycle.id.slice(0, 6)}`}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={cycle.status === 'open' ? 'status-open' : 'status-closed'}>
              {cycle.status}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Started {new Date(cycle.startDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        {cycle.status === 'open' && (
          <div className="flex gap-2">
            <Link to={`/orders/new?cycleId=${cycle.id}`}>
              <Button size="lg" variant="outline">
                <ShoppingCart className="w-5 h-5 mr-2" />
                New Order
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Weight</p>
                <p className="text-2xl font-bold">{cycle.totalWeightKg} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/10">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost/kg</p>
                <p className="text-2xl font-bold">GH₵ {cycle.costPerKg}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/10">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">GH₵ {totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-muted">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profit</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  GH₵ {profit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weight Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Weight Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-semibold">{usedWeight.toLocaleString()} kg ({usedPercent.toFixed(1)}%)</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Distributed</p>
                  <p className="text-2xl font-bold text-primary">{usedWeight.toLocaleString()} kg</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold text-success">{remaining.toLocaleString()} kg</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Client Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {clientDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={clientDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {clientDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} kg`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">
                No orders yet for this cycle
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders from this Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Weight</th>
                    <th>Price/kg</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const client = getClientById(order.clientId);
                    return (
                      <tr key={order.id}>
                        <td className="font-semibold">{client?.name || 'Unknown'}</td>
                        <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                        <td>{order.totalWeightKg} kg</td>
                        <td>GH₵ {order.pricePerKg}</td>
                        <td className="font-semibold">GH₵ {(order.totalWeightKg * order.pricePerKg).toLocaleString()}</td>
                        <td>
                          <span className={
                            order.status === 'completed' ? 'status-open' :
                            order.status === 'pending' ? 'status-pending' :
                            'status-closed'
                          }>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/orders/${order.id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No orders have been created from this cycle yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
