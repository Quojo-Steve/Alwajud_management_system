import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import {
  Plus, Search, Users, MapPin, Phone, ShoppingCart, ArrowRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

const Url = import.meta.env.VITE_ROUTE;

export default function ClientsList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'revenue'>('name');

  useEffect(() => {
    axiosService('get', '/clients')
      .then(setClients)
      .catch(() => toast({ title: "Error", description: "Failed to load clients.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const filtered = clients
    .filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'orders') return Number(b.total_orders) - Number(a.total_orders);
      if (sortBy === 'revenue') return Number(b.total_revenue) - Number(a.total_revenue);
      return a.name.localeCompare(b.name);
    });

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
          <h1 className="text-3xl font-display font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database</p>
        </div>
        <Button size="lg" onClick={() => navigate('/clients/new')} className="h-14">
          <Plus className="w-5 h-5 mr-2" /> Add Client
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
          {(['name', 'orders', 'revenue'] as const).map(s => (
            <Button
              key={s}
              variant={sortBy === s ? 'default' : 'outline'}
              onClick={() => setSortBy(s)}
              className="h-12 capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((client) => (
            <Card key={client.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    {client.logo
                      ? <AvatarImage src={client.logo} alt={client.name} />
                      : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{client.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="w-4 h-4 shrink-0" /> {client.location}
                    </p>
                    {client.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="w-4 h-4 shrink-0" /> {client.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                  <div>
                    <p className="text-2xl font-bold">{client.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Number(client.total_weight).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">kg Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">
                      GH₵{(Number(client.total_revenue) / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>

                {client.last_order_date && (
                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                    Last order: {new Date(client.last_order_date).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <Link to={`/orders/new?clientId=${client.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <ShoppingCart className="w-4 h-4 mr-1" /> Order
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
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No clients found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Try adjusting your search' : 'Add your first client to start managing orders'}
            </p>
            <Button onClick={() => navigate('/clients/new')}>
              <Plus className="w-5 h-5 mr-2" /> Add First Client
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}