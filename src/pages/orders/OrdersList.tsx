import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import {
  Plus, Search, ShoppingCart, Calendar, ArrowRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';

export default function OrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      axiosService('get', '/orders'),
      axiosService('get', '/clients'),
    ])
      .then(([ordersData, clientsData]) => {
        setOrders(ordersData);
        setClients(clientsData);
      })
      .catch(() => toast({ title: "Error", description: "Failed to load orders.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders
    .filter(order => {
      const matchesSearch =
        order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.id).includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesClient = clientFilter === 'all' || String(order.client_id) === clientFilter;
      return matchesSearch && matchesStatus && matchesClient;
    })
    .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage all customer orders</p>
        </div>
        <Button size="lg" onClick={() => navigate('/orders/new')} className="h-14">
          <Plus className="w-5 h-5 mr-2" /> New Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by client name or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-lg"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-12">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48 h-12">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Cycle</th>
                    <th>Weight</th>
                    <th>Rolls</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Receipt</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link to={`/clients/${order.client_id}`} className="font-semibold text-primary hover:underline">
                          {order.client_name}
                        </Link>
                      </td>
                      <td>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(order.order_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="text-sm text-muted-foreground">#{order.cycle_id}</td>
                      <td>{order.total_weight_kg} kg</td>
                      <td>{order.num_rolls}</td>
                      <td className="font-semibold">
                        GH₵ {(Number(order.total_weight_kg) * Number(order.price_per_kg)).toLocaleString()}
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
                        {order.receipt_number
                          ? <span className="text-success text-sm font-medium">{order.receipt_number}</span>
                          : <span className="text-muted-foreground text-sm">—</span>}
                      </td>
                      <td>
                        <Link to={`/orders/${order.id}`}>
                          <Button size="sm" variant="ghost">
                            View <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first order to get started'}
            </p>
            <Button onClick={() => navigate('/orders/new')}>
              <Plus className="w-5 h-5 mr-2" /> Create First Order
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}