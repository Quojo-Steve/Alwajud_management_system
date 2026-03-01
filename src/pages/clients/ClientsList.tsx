import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { 
  Plus, 
  Search, 
  Users,
  MapPin,
  Phone,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ClientsList() {
  const navigate = useNavigate();
  const { clients, getOrdersByClient, getClientRevenue, getClientTotalWeight } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'revenue'>('name');

  const filteredClients = clients
    .filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(client => ({
      ...client,
      orders: getOrdersByClient(client.id),
      revenue: getClientRevenue(client.id),
      totalWeight: getClientTotalWeight(client.id),
    }))
    .sort((a, b) => {
      switch (sortBy) {
        case 'orders':
          return b.orders.length - a.orders.length;
        case 'revenue':
          return b.revenue - a.revenue;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Clients
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/clients/new')} className="h-14">
          <Plus className="w-5 h-5 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-lg"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            onClick={() => setSortBy('name')}
            className="h-12"
          >
            Name
          </Button>
          <Button
            variant={sortBy === 'orders' ? 'default' : 'outline'}
            onClick={() => setSortBy('orders')}
            className="h-12"
          >
            Orders
          </Button>
          <Button
            variant={sortBy === 'revenue' ? 'default' : 'outline'}
            onClick={() => setSortBy('revenue')}
            className="h-12"
          >
            Revenue
          </Button>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const lastOrder = client.orders.sort((a, b) => 
              new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
            )[0];

            return (
              <Card key={client.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={client.imagePath} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {client.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        {client.location}
                      </p>
                      {client.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          {client.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{client.orders.length}</p>
                      <p className="text-xs text-muted-foreground">Orders</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{client.totalWeight.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">kg Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">GH₵{(client.revenue / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>

                  {lastOrder && (
                    <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                      Last order: {new Date(lastOrder.orderDate).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Link to={`/orders/new?clientId=${client.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Order
                      </Button>
                    </Link>
                    <Link to={`/clients/${client.id}`} className="flex-1">
                      <Button className="w-full">
                        View <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No clients found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? 'Try adjusting your search'
                : 'Add your first client to start managing orders'
              }
            </p>
            <Button onClick={() => navigate('/clients/new')}>
              <Plus className="w-5 h-5 mr-2" />
              Add First Client
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
