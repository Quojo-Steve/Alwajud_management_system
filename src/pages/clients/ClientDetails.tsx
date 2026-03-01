import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Calendar,
  ShoppingCart,
  Package,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClientById, getOrdersByClient, getClientRevenue, getClientTotalWeight, getCycleById } = useData();

  const client = getClientById(id || '');
  const orders = getOrdersByClient(id || '');
  const revenue = getClientRevenue(id || '');
  const totalWeight = getClientTotalWeight(id || '');

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Client not found</h2>
        <Button onClick={() => navigate('/clients')}>Back to Clients</Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Monthly breakdown for chart
  const monthlyData = orders.reduce((acc, order) => {
    const month = new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const existing = acc.find(item => item.month === month);
    const orderRevenue = order.totalWeightKg * order.pricePerKg;
    if (existing) {
      existing.revenue += orderRevenue;
      existing.weight += order.totalWeightKg;
    } else {
      acc.push({ month, revenue: orderRevenue, weight: order.totalWeightKg });
    }
    return acc;
  }, [] as { month: string; revenue: number; weight: number }[]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Button 
          variant="ghost" 
          onClick={() => navigate('/clients')}
          className="mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Clients
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={client.imagePath} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold text-foreground">
              {client.name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {client.location}
              </span>
              {client.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Since {new Date(client.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Link to={`/orders/new?clientId=${client.id}`}>
            <Button size="lg">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Create Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Notes */}
      {client.notes && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Notes</p>
                <p className="text-muted-foreground">{client.notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/10">
                <Package className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Weight</p>
                <p className="text-3xl font-bold">{totalWeight.toLocaleString()} kg</p>
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
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold">GH₵ {revenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `GH₵ ${value.toLocaleString()}`}
                  labelStyle={{ color: '#1e3a8a' }}
                />
                <Bar dataKey="revenue" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Cycle</th>
                    <th>Weight</th>
                    <th>Price/kg</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                    .map((order) => {
                      const cycle = getCycleById(order.cycleId);
                      return (
                        <tr key={order.id}>
                          <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                          <td>{cycle?.supplierName || order.cycleId.slice(0, 6)}</td>
                          <td>{order.totalWeightKg} kg</td>
                          <td>GH₵ {order.pricePerKg}</td>
                          <td className="font-semibold">
                            GH₵ {(order.totalWeightKg * order.pricePerKg).toLocaleString()}
                          </td>
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
              No orders yet for this client.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
