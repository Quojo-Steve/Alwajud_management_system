import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import { ArrowLeft, RefreshCcw, Package, DollarSign, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function NewCycle() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    total_weight_kg: '',
    cost_per_kg: '',
    supplier_id: '',
  });

  useEffect(() => {
    // Load suppliers for the dropdown
    axiosService('get', '/suppliers')
      .then(setSuppliers)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axiosService('post', '/cycle', {
        start_date: formData.start_date,
        total_weight_kg: parseFloat(formData.total_weight_kg),
        cost_per_kg: parseFloat(formData.cost_per_kg),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
      });

      toast({ title: "Cycle Created", description: "Production cycle created successfully." });
      navigate(`/cycles/${res.cycle_id}`);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.detail || "Failed to create cycle.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.start_date &&
    parseFloat(formData.total_weight_kg) > 0 &&
    parseFloat(formData.cost_per_kg) > 0;

  const totalCost = formData.total_weight_kg && formData.cost_per_kg
    ? parseFloat(formData.total_weight_kg) * parseFloat(formData.cost_per_kg)
    : null;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/cycles')} className="mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Cycles
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground">New Production Cycle</h1>
        <p className="text-muted-foreground mt-1">Start a new batch to track incoming rubber weight</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-primary" /> Cycle Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date Opened
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="h-14 text-lg"
                required
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <Package className="w-4 h-4" /> Total Weight Received (kg)
              </label>
              <Input
                type="number" step="0.01" min="0"
                value={formData.total_weight_kg}
                onChange={(e) => handleChange('total_weight_kg', e.target.value)}
                placeholder="e.g., 500"
                className="h-14 text-lg"
                required
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Cost per kg (GH₵)
              </label>
              <Input
                type="number" step="0.01" min="0"
                value={formData.cost_per_kg}
                onChange={(e) => handleChange('cost_per_kg', e.target.value)}
                placeholder="e.g., 5.00"
                className="h-14 text-lg"
                required
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <User className="w-4 h-4" /> Supplier (Optional)
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => handleChange('supplier_id', e.target.value)}
                className="w-full h-14 text-lg rounded-md border border-input bg-background px-3"
              >
                <option value="">-- No supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground mt-1">
                <a href="/suppliers/new" className="text-primary underline">+ Add a new supplier</a> if not listed
              </p>
            </div>

            {totalCost !== null && (
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-1">Cost Summary</h4>
                <p className="text-2xl font-bold text-primary">GH₵ {totalCost.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total investment for this cycle</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/cycles')} className="flex-1 h-14 text-lg">
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid || isSubmitting} className="flex-1 h-14 text-lg">
                {isSubmitting ? 'Creating...' : 'Create Cycle'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}