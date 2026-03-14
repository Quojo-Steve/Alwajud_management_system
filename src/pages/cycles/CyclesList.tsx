import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import {
  Plus, Search, RefreshCcw, Calendar, Package, DollarSign, ArrowRight, AlertTriangle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';

export default function CyclesList() {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'Open' | 'Closed'>('all');
  const [closingCycle, setClosingCycle] = useState<any | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const fetchCycles = async () => {
    try {
      const data = await axiosService('get', '/cycles');
      setCycles(data);
    } catch {
      toast({ title: "Error", description: "Failed to load cycles.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCycles(); }, []);

  const handleCloseCycle = async () => {
    if (!closingCycle) return;
    setIsClosing(true);
    try {
      await axiosService('put', `/cycle/${closingCycle.id}/close`);
      toast({ title: "Cycle Closed", description: "The production cycle has been closed." });
      setClosingCycle(null);
      fetchCycles();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.detail || "Failed to close cycle.",
        variant: "destructive"
      });
    } finally {
      setIsClosing(false);
    }
  };

  const filteredCycles = cycles
    .filter(cycle => {
      const matchesSearch =
        cycle.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(cycle.id).includes(searchTerm);
      const matchesFilter = filter === 'all' || cycle.status === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

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
          <h1 className="text-3xl font-display font-bold text-foreground">Production Cycles</h1>
          <p className="text-muted-foreground mt-1">Manage your production batches and track inventory</p>
        </div>
        <Button size="lg" onClick={() => navigate('/cycles/new')} className="h-14">
          <Plus className="w-5 h-5 mr-2" /> New Cycle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by supplier or cycle ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-lg"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'Open', 'Closed'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="h-12 px-6 capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Cycles Grid */}
      {filteredCycles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCycles.map((cycle) => {
            const remaining = Number(cycle.weight_remaining);
            const total = Number(cycle.total_weight_kg);
            const used = Number(cycle.weight_distributed);
            const usedPercent = total > 0 ? (used / total) * 100 : 0;
            const revenue = Number(cycle.revenue);
            const isLowStock = remaining < total * 0.2 && cycle.status === 'Open';

            return (
              <Card key={cycle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-display">
                        {cycle.supplier_name || `Cycle #${cycle.id}`}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(cycle.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={cycle.status === 'Open' ? 'status-open' : 'status-closed'}>
                      {cycle.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLowStock && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 text-warning text-sm">
                      <AlertTriangle className="w-4 h-4" /> Low stock warning
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Weight</p>
                      <p className="text-lg font-semibold flex items-center gap-1">
                        <Package className="w-4 h-4 text-primary" />
                        {total.toLocaleString()} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cost/kg</p>
                      <p className="text-lg font-semibold flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-accent" />
                        GH₵ {cycle.cost_per_kg}
                      </p>
                    </div>
                  </div>

                  {cycle.status === 'Open' && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-medium">{remaining.toLocaleString()} kg</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${usedPercent}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-lg font-bold text-success">GH₵ {revenue.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {cycle.status === 'Open' && (
                        <Button variant="outline" size="sm" onClick={() => setClosingCycle(cycle)}>
                          Close
                        </Button>
                      )}
                      <Link to={`/cycles/${cycle.id}`}>
                        <Button size="sm">View <ArrowRight className="w-4 h-4 ml-1" /></Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <RefreshCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No cycles found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start your first production cycle to begin tracking inventory'}
            </p>
            <Button onClick={() => navigate('/cycles/new')}>
              <Plus className="w-5 h-5 mr-2" /> Create First Cycle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Close Cycle Dialog */}
      <Dialog open={!!closingCycle} onOpenChange={() => setClosingCycle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Production Cycle</DialogTitle>
            <DialogDescription>
              This will archive the cycle and prevent new orders from being added.
            </DialogDescription>
          </DialogHeader>
          {closingCycle && (
            <div className="py-4 space-y-2">
              <p><strong>Supplier:</strong> {closingCycle.supplier_name || 'Unknown'}</p>
              <p><strong>Total Weight:</strong> {Number(closingCycle.total_weight_kg).toLocaleString()} kg</p>
              <p><strong>Remaining:</strong> {Number(closingCycle.weight_remaining).toLocaleString()} kg</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosingCycle(null)}>Cancel</Button>
            <Button onClick={handleCloseCycle} disabled={isClosing}>
              {isClosing ? 'Closing...' : 'Close Cycle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}