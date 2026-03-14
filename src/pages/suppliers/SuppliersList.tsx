import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import {
  Plus, Search, Truck, MapPin, Phone, ArrowRight,
  TrendingDown, Wallet, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function SuppliersList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    axiosService('get', '/suppliers')
      .then(setSuppliers)
      .catch(() => toast({ title: "Error", description: "Failed to load suppliers.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-display font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage suppliers and track outstanding balances</p>
        </div>
        <Button size="lg" onClick={() => navigate('/suppliers/new')} className="h-14">
          <Plus className="w-5 h-5 mr-2" /> New Supplier
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 text-lg"
        />
      </div>

      {/* Summary Strip */}
      {suppliers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Total Suppliers',
              value: suppliers.length,
              icon: Truck,
              color: 'text-primary'
            },
            {
              label: 'Total Purchased',
              value: `GH₵ ${suppliers.reduce((s, x) => s + Number(x.total_purchased), 0).toLocaleString()}`,
              icon: TrendingDown,
              color: 'text-destructive'
            },
            {
              label: 'Total Balance Due',
              value: `GH₵ ${suppliers.reduce((s, x) => s + Number(x.balance_due), 0).toLocaleString()}`,
              icon: Wallet,
              color: 'text-warning'
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Suppliers Grid */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((supplier) => {
            const purchased = Number(supplier.total_purchased);
            const paid = Number(supplier.total_paid);
            const balance = Number(supplier.balance_due);
            const paidPercent = purchased > 0 ? (paid / purchased) * 100 : 0;

            return (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-display">{supplier.name}</CardTitle>
                      {supplier.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {supplier.location}
                        </p>
                      )}
                      {supplier.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {supplier.phone}
                        </p>
                      )}
                    </div>
                    {balance > 0 && (
                      <div className="flex items-center gap-1 text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Owes
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-muted-foreground">Purchased</p>
                      <p className="text-lg font-bold text-destructive">GH₵ {purchased.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-muted-foreground">Paid</p>
                      <p className="text-lg font-bold text-success">GH₵ {paid.toLocaleString()}</p>
                    </div>
                  </div>

                  {purchased > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Payment progress</span>
                        <span className="font-medium">{paidPercent.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full transition-all"
                          style={{ width: `${Math.min(paidPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Balance Due</p>
                      <p className={`text-lg font-bold ${balance > 0 ? 'text-destructive' : 'text-success'}`}>
                        GH₵ {balance.toLocaleString()}
                      </p>
                    </div>
                    <Link to={`/suppliers/${supplier.id}`}>
                      <Button size="sm">
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
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No suppliers found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Try adjusting your search' : 'Add your first supplier to start tracking purchases'}
            </p>
            <Button onClick={() => navigate('/suppliers/new')}>
              <Plus className="w-5 h-5 mr-2" /> Add Supplier
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}