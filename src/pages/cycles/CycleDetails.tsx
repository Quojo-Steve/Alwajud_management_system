import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import {
  ArrowLeft, Calendar, Package, DollarSign, User, ShoppingCart, TrendingUp, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from '@/hooks/use-toast';

const COLORS = ['#1e3a8a', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function CycleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCycle = async () => {
    try {
      const data = await axiosService('get', `/cycles/${id}`);
      setCycle(data);
    } catch {
      toast({ title: "Error", description: "Failed to load cycle.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCycle(); }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!cycle) return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold mb-4">Cycle not found</h2>
      <Button onClick={() => navigate('/cycles')}>Back to Cycles</Button>
    </div>
  );

  const total = Number(cycle.total_weight_kg);
  const used = Number(cycle.weight_distributed);
  const remaining = Number(cycle.weight_remaining);
  const usedPercent = total > 0 ? (used / total) * 100 : 0;
  const revenue = Number(cycle.revenue);
  const totalCost = used * Number(cycle.cost_per_kg);
  const profit = revenue - totalCost;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={() => navigate('/cycles')} className="mb-2">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Cycles
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {cycle.supplier_name || `Cycle #${cycle.id}`}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={cycle.status === 'Open' ? 'status-open' : 'status-closed'}>
              {cycle.status}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Started {new Date(cycle.start_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        {cycle.status === 'Open' && (
          <Link to={`/orders/new?cycleId=${cycle.id}`}>
            <Button size="lg" variant="outline">
              <ShoppingCart className="w-5 h-5 mr-2" /> New Order
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Weight', value: `${total.toLocaleString()} kg`, icon: Package, color: 'bg-primary/10', iconColor: 'text-primary' },
          { label: 'Cost/kg', value: `GH₵ ${cycle.cost_per_kg}`, icon: DollarSign, color: 'bg-accent/10', iconColor: 'text-accent' },
          { label: 'Revenue', value: `GH₵ ${revenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-success/10', iconColor: 'text-success' },
          { label: 'Profit', value: `GH₵ ${profit.toLocaleString()}`, icon: User, color: 'bg-muted', iconColor: profit >= 0 ? 'text-success' : 'text-destructive' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${s.color}`}>
                  <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.label === 'Profit' ? (profit >= 0 ? 'text-success' : 'text-destructive') : ''}`}>
                    {s.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress + Pie */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Weight Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Used</span>
                <span className="font-semibold">{used.toLocaleString()} kg ({usedPercent.toFixed(1)}%)</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${usedPercent}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Distributed</p>
                <p className="text-2xl font-bold text-primary">{used.toLocaleString()} kg</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold text-success">{remaining.toLocaleString()} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Client Distribution</CardTitle></CardHeader>
          <CardContent>
            {cycle.distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={cycle.distribution}
                    cx="50%" cy="50%"
                    outerRadius={80}
                    dataKey="total_weight"
                    nameKey="client_name"
                    label={({ client_name, percent }) => `${client_name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {cycle.distribution.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} kg`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No orders yet for this cycle</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader><CardTitle>Orders from this Cycle</CardTitle></CardHeader>
        <CardContent>
          {cycle.orders?.length > 0 ? (
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
                  {cycle.orders.map((order: any) => (
                    <tr key={order.id}>
                      <td className="font-semibold">{order.client_name}</td>
                      <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td>{order.total_weight_kg} kg</td>
                      <td>GH₵ {order.price_per_kg}</td>
                      <td className="font-semibold">
                        GH₵ {(order.total_weight_kg * order.price_per_kg).toLocaleString()}
                      </td>
                      <td>
                        <span className={
                          order.status === 'Completed' ? 'status-open' :
                          order.status === 'Pending' ? 'status-pending' : 'status-closed'
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No orders have been created from this cycle yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}