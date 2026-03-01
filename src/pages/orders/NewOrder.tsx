import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Users, 
  RefreshCcw,
  Package,
  DollarSign,
  Calendar,
  Plus,
  Minus,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';

export default function NewOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clients, cycles, addOrder, getRemainingWeight } = useData();
  
  const preselectedClientId = searchParams.get('clientId') || '';
  const preselectedCycleId = searchParams.get('cycleId') || '';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientId: preselectedClientId,
    cycleId: preselectedCycleId,
    pricePerKg: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    numberOfRolls: '1',
  });
  const [rollWeights, setRollWeights] = useState<string[]>(['']);

  const activeCycles = cycles.filter(c => c.status === 'open');
  const selectedCycle = cycles.find(c => c.id === formData.cycleId);
  const remainingWeight = formData.cycleId ? getRemainingWeight(formData.cycleId) : 0;

  // Calculate total weight from roll inputs
  const totalWeight = rollWeights.reduce((sum, w) => sum + (parseFloat(w) || 0), 0);
  const pricePerKg = parseFloat(formData.pricePerKg) || 0;
  const orderTotal = totalWeight * pricePerKg;
  const exceededWeight = totalWeight > remainingWeight && !!formData.cycleId;

  // Resize roll weights array when numberOfRolls changes, preserving existing values
  useEffect(() => {
    const numRolls = Math.max(1, parseInt(formData.numberOfRolls) || 1);
    setRollWeights(prev => {
      if (numRolls > prev.length) {
        return [...prev, ...Array(numRolls - prev.length).fill('')];
      } else {
        return prev.slice(0, numRolls);
      }
    });
  }, [formData.numberOfRolls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const rolls = rollWeights.map((weight, index) => ({
        id: `roll-${Date.now()}-${index}`,
        rollNumber: index + 1,
        weightKg: parseFloat(weight) || 0,
      }));

      const newOrder = addOrder({
        clientId: formData.clientId,
        cycleId: formData.cycleId,
        totalWeightKg: totalWeight,
        pricePerKg: parseFloat(formData.pricePerKg),
        rolls,
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate || undefined,
        status: 'pending',
      });

      toast({
        title: "Order Created",
        description: "The order has been created successfully.",
      });

      navigate(`/orders/${newOrder.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const allRollsFilled = rollWeights.every(w => parseFloat(w) > 0);

  const isValid =
    formData.clientId &&
    formData.cycleId &&
    totalWeight > 0 &&
    allRollsFilled &&
    pricePerKg > 0 &&
    !exceededWeight;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/orders')}
          className="mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Orders
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Create New Order
        </h1>
        <p className="text-muted-foreground mt-1">
          Fill in the order details for your customer
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & Cycle Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="form-label flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Select Client *
                </label>
                <Select value={formData.clientId} onValueChange={(v) => handleChange('clientId', v)}>
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  Source Cycle *
                </label>
                <Select value={formData.cycleId} onValueChange={(v) => handleChange('cycleId', v)}>
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choose a cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCycles.map(cycle => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.supplierName || cycle.id.slice(0, 6)} - {getRemainingWeight(cycle.id)} kg available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCycle && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Available: <span className="font-semibold text-success">{remainingWeight} kg</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="form-label flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Order Date *
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
                  <Calendar className="w-4 h-4" />
                  Expected Delivery
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

        {/* Rolls & Price */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Rolls & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price per kg */}
            <div className="max-w-sm">
              <label className="form-label flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price per kg (GH₵) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePerKg}
                onChange={(e) => handleChange('pricePerKg', e.target.value)}
                placeholder="e.g., 8.00"
                className="h-14 text-lg"
                required
              />
            </div>

            {/* Number of Rolls */}
            <div>
              <label className="form-label">Number of Rolls</label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-14 w-14"
                  onClick={() => {
                    const num = Math.max(1, parseInt(formData.numberOfRolls) - 1);
                    handleChange('numberOfRolls', num.toString());
                  }}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={formData.numberOfRolls}
                  onChange={(e) => handleChange('numberOfRolls', e.target.value)}
                  className="h-14 text-lg text-center w-24"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-14 w-14"
                  onClick={() => {
                    const num = parseInt(formData.numberOfRolls) + 1;
                    handleChange('numberOfRolls', num.toString());
                  }}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Roll Weight Inputs */}
            <div>
              <label className="form-label">Roll Weights (kg) *</label>
              <p className="text-sm text-muted-foreground mb-3">
                Enter the weight for each roll — total weight will be calculated automatically.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {rollWeights.map((weight, index) => (
                  <div key={index}>
                    <label className="text-xs text-muted-foreground mb-1 block">Roll {index + 1}</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={weight}
                      onChange={(e) => handleRollWeightChange(index, e.target.value)}
                      placeholder="0.00"
                      className="h-12"
                    />
                  </div>
                ))}
              </div>

              {/* Live total weight display */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-muted-foreground text-sm">Calculated Total Weight:</span>
                <span className={`text-lg font-bold ${exceededWeight ? 'text-destructive' : 'text-primary'}`}>
                  {totalWeight.toFixed(2)} kg
                </span>
                {exceededWeight && (
                  <span className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Exceeds available weight ({remainingWeight} kg)
                  </span>
                )}
              </div>
            </div>

            {/* Order Summary */}
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
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-primary">
                        GH₵ {orderTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/orders')}
            className="flex-1 h-14 text-lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1 h-14 text-lg"
          >
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}