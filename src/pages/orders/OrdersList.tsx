import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { 
  Plus, 
  Search, 
  ShoppingCart,
  Calendar,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrdersList() {
  const navigate = useNavigate();
  const { orders, clients, cycles, getClientById, getCycleById, getReceiptByOrderId } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  const filteredOrders = orders
    .filter(order => {
      const client = getClientById(order.clientId);
      const matchesSearch = client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesClient = clientFilter === 'all' || order.clientId === clientFilter;
      return matchesSearch && matchesStatus && matchesClient;
    })
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all customer orders
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/orders/new')} className="h-14">
          <Plus className="w-5 h-5 mr-2" />
          New Order
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48 h-12">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
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
                  {filteredOrders.map((order) => {
                    const client = getClientById(order.clientId);
                    const cycle = getCycleById(order.cycleId);
                    const receipt = getReceiptByOrderId(order.id);
                    const total = order.totalWeightKg * order.pricePerKg;

                    return (
                      <tr key={order.id}>
                        <td>
                          <Link 
                            to={`/clients/${order.clientId}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {client?.name || 'Unknown'}
                          </Link>
                        </td>
                        <td>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(order.orderDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td>{cycle?.supplierName || order.cycleId.slice(0, 6)}</td>
                        <td>{order.totalWeightKg} kg</td>
                        <td>{order.rolls.length}</td>
                        <td className="font-semibold">GH₵ {total.toLocaleString()}</td>
                        <td>
                          <span className={
                            order.status === 'completed' ? 'status-open' :
                            order.status === 'pending' ? 'status-pending' :
                            'status-closed'
                          }>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          {receipt ? (
                            <span className="text-success text-sm font-medium">
                              {receipt.receiptNumber}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </td>
                        <td>
                          <Link to={`/orders/${order.id}`}>
                            <Button size="sm" variant="ghost">
                              View <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
                : 'Create your first order to get started'
              }
            </p>
            <Button onClick={() => navigate('/orders/new')}>
              <Plus className="w-5 h-5 mr-2" />
              Create First Order
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
