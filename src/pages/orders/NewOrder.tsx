import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import {
  ArrowLeft, ShoppingCart, Users, RefreshCcw, Package,
  DollarSign, Calendar, Plus, Minus, AlertTriangle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';

export default function NewOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedClientId = searchParams.get('clientId') || '';
  const preselectedCycleId = searchParams.get('cycleId') || '';

  const [clients, setClients] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    clientId: preselectedClientId,
    cycleId: preselectedCycleId,
    pricePerKg: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    numberOfRolls: '1',
  });
  const [rollWeights, setRollWeights] = useState<string[]>(['']);

  useEffect(() => {
    Promise.all([
      axiosService('get', '/clients'),
      axiosService('get', '/cycles'),
    ])
      .then(([clientsData, cyclesData]) => {
        setClients(clientsData);
        setCycles(cyclesData.filter((c: any) => c.status === 'Open'));
      })
      .catch(() => toast({ title: "Error", description: "Failed to load form data.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  // Resize roll weights array when numberOfRolls changes
  useEffect(() => {
    const num = Math.max(1, parseInt(formData.numberOfRolls) || 1);
    setRollWeights(prev =>
      num > prev.length
        ? [...prev, ...Array(num - prev.length).fill('')]
        : prev.slice(0, num)
    );
  }, [formData.numberOfRolls]);

  const selectedCycle = cycles.find(c => String(c.id) === formData.cycleId);
  const remainingWeight = selectedCycle ? Number(selectedCycle.weight_remaining) : 0;
  const totalWeight = rollWeights.reduce((sum, w) => sum + (parseFloat(w) || 0), 0);
  const pricePerKg = parseFloat(formData.pricePerKg) || 0;
  const orderTotal = totalWeight * pricePerKg;
  const exceededWeight = totalWeight > remainingWeight && !!formData.cycleId;
  const allRollsFilled = rollWeights.every(w => parseFloat(w) > 0);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRollWeightChange = (index: number, value: string) => {
    setRollWeights(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axiosService('post', '/order', {
        client_id: parseInt(formData.clientId),
        cycle_id: parseInt(formData.cycleId),
        total_weight_kg: totalWeight,
        price_per_kg: pricePerKg,
        num_rolls: parseInt(formData.numberOfRolls),
        order_date: formData.orderDate,
        delivery_date: formData.deliveryDate || null,
        status: 'Pending',
      });

      // Update rolls with custom weights if they differ from auto-generated
      // (backend auto-generates equal rolls, frontend may have custom weights)
      toast({ title: "Order Created", description: "The order has been created successfully." });
      navigate(`/orders/${res.order_id}`);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.detail || "Failed to create order.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    formData.clientId && formData.cycleId &&
    totalWeight > 0 && allRollsFilled &&
    pricePerKg > 0 && !exceededWeight;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Orders
        </Button>
        <h1 className="text-3xl font-display font-bold">Create New Order</h1>
        <p className="text-muted-foreground mt-1">Fill in the order details for your customer</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="form-label flex items-center gap-2">
                  <Users className="w-4 h-4" /> Select Client *
                </label>
                <Select value={formData.clientId} onValueChange={(v) => handleChange('clientId', v)}>
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} — {c.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" /> Source Cycle *
                </label>
                <Select value={formData.cycleId} onValueChange={(v) => handleChange('cycleId', v)}>
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choose a cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.supplier_name || `Cycle #${c.id}`} — {Number(c.weight_remaining).toLocaleString()} kg left
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCycle && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Available: <span className="font-semibold text-success">{remainingWeight.toLocaleString()} kg</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="form-label flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Order Date *
                </label>
                <Input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => handleChange('orderDate', e.target.value)}
                  className="h-14 text-lg"
                  required
                />
              </div>
              <div>
                <label className="form-label flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Expected Delivery
                </label>
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => handleChange('deliveryDate', e.target.value)}
                  className="h-14 text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Rolls & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="max-w-sm">
              <label className="form-label flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Price per kg (GH₵) *
              </label>
              <Input
                type="number" step="0.01" min="0"
                value={formData.pricePerKg}
                onChange={(e) => handleChange('pricePerKg', e.target.value)}
                placeholder="e.g., 8.00"
                className="h-14 text-lg"
                required
              />
            </div>

            <div>
              <label className="form-label">Number of Rolls</label>
              <div className="flex items-center gap-4">
                <Button
                  type="button" variant="outline" size="icon" className="h-14 w-14"
                  onClick={() => handleChange('numberOfRolls', String(Math.max(1, parseInt(formData.numberOfRolls) - 1)))}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <Input
                  type="number" min="1"
                  value={formData.numberOfRolls}
                  onChange={(e) => handleChange('numberOfRolls', e.target.value)}
                  className="h-14 text-lg text-center w-24"
                />
                <Button
                  type="button" variant="outline" size="icon" className="h-14 w-14"
                  onClick={() => handleChange('numberOfRolls', String(parseInt(formData.numberOfRolls) + 1))}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div>
              <label className="form-label">Roll Weights (kg) *</label>
              <p className="text-sm text-muted-foreground mb-3">
                Enter the weight for each roll — total is calculated automatically.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {rollWeights.map((weight, index) => (
                  <div key={index}>
                    <label className="text-xs text-muted-foreground mb-1 block">Roll {index + 1}</label>
                    <Input
                      type="number" step="0.01" min="0"
                      value={weight}
                      onChange={(e) => handleRollWeightChange(index, e.target.value)}
                      placeholder="0.00"
                      className="h-12"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-muted-foreground text-sm">Total Weight:</span>
                <span className={`text-lg font-bold ${exceededWeight ? 'text-destructive' : 'text-primary'}`}>
                  {totalWeight.toFixed(2)} kg
                </span>
                {exceededWeight && (
                  <span className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Exceeds available ({remainingWeight} kg)
                  </span>
                )}
              </div>
            </div>

            {orderTotal > 0 && allRollsFilled && (
              <div className="p-6 rounded-xl bg-primary/5 border-2 border-primary/20">
                <h4 className="font-semibold mb-4 text-lg">Order Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Weight</span>
                    <span className="font-semibold">{totalWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per kg</span>
                    <span className="font-semibold">GH₵ {pricePerKg}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Number of Rolls</span>
                    <span className="font-semibold">{formData.numberOfRolls}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">GH₵ {orderTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/orders')} className="flex-1 h-14 text-lg">
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid || isSubmitting} className="flex-1 h-14 text-lg">
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}