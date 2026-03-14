import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import {
  RefreshCcw,
  Users,
  TrendingUp,
  Package,
  ArrowRight,
  ShoppingCart,
  Receipt as ReceiptIcon,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [activeCycles, setActiveCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashData, ordersData, cyclesData] = await Promise.all([
          axiosService('get', '/dashboard'),
          axiosService('get', '/orders', { status: 'Pending' }),
          axiosService('get', '/cycles'),
        ]);

        setStats(dashData);
        setRecentOrders(ordersData.slice(0, 5));
        setActiveCycles(cyclesData.filter((c: any) => c.status === 'Open'));
      } catch (err: any) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = stats ? [
    {
      title: 'Active Cycles',
      value: stats.active_cycles,
      icon: RefreshCcw,
      color: 'bg-primary text-primary-foreground',
      link: '/cycles'
    },
    {
      title: 'Total Clients',
      value: stats.total_clients,
      icon: Users,
      color: 'bg-accent text-accent-foreground',
      link: '/clients'
    },
    {
      title: "This Month's Revenue",
      value: `GH₵ ${Number(stats.monthly_revenue).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-success text-success-foreground',
      link: '/analytics'
    },
    {
      title: 'Stock Available',
      value: `${Number(stats.total_stock_kg).toLocaleString()} kg`,
      icon: Package,
      color: 'bg-secondary text-secondary-foreground',
      link: '/cycles'
    },
  ] : [];

  const quickActions = [
    { label: 'New Cycle',   icon: RefreshCcw,   link: '/cycles/new' },
    { label: 'New Client',  icon: Users,         link: '/clients/new' },
    { label: 'New Order',   icon: ShoppingCart,  link: '/orders/new' },
    { label: 'Receipts',    icon: ReceiptIcon,   link: '/receipts' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
          Welcome to Alwajud Ventures
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Here's an overview of your factory operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="stat-card group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground font-medium mb-1">{stat.title}</p>
                <p className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              View details <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.link} className="action-button">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors">
                <action.icon className="w-7 h-7" />
              </div>
              <span className="text-lg">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-display">Recent Orders</CardTitle>
            <Link to="/orders">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{order.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.total_weight_kg} kg · {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        GH₵ {(order.total_weight_kg * order.price_per_kg).toLocaleString()}
                      </p>
                      <span className={
                        order.status === 'Completed' ? 'status-open' :
                        order.status === 'Pending'   ? 'status-pending' :
                        'status-closed'
                      }>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No orders yet. Create your first order!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active Cycles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-display">Active Cycles</CardTitle>
            <Link to="/cycles">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeCycles.length > 0 ? (
              <div className="space-y-3">
                {activeCycles.map((cycle) => {
                  const used = Number(cycle.weight_distributed);
                  const total = Number(cycle.total_weight_kg);
                  const remaining = Number(cycle.weight_remaining);
                  const usedPercent = total > 0 ? (used / total) * 100 : 0;

                  return (
                    <Link
                      key={cycle.id}
                      to={`/cycles/${cycle.id}`}
                      className="block p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-foreground">
                          {cycle.supplier_name || `Cycle #${cycle.id}`}
                        </p>
                        <span className="status-open">Open</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{remaining.toLocaleString()} kg remaining</span>
                          <span>{usedPercent.toFixed(0)}% used</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${usedPercent}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No active cycles. Start a new production cycle!
              </p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}