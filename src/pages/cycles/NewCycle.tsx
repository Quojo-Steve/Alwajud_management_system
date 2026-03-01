import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, RefreshCcw, Package, DollarSign, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function NewCycle() {
  const navigate = useNavigate();
  const { addCycle } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    totalWeightKg: '',
    costPerKg: '',
    supplierName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newCycle = addCycle({
        startDate: formData.startDate,
        totalWeightKg: parseFloat(formData.totalWeightKg),
        costPerKg: parseFloat(formData.costPerKg),
        supplierName: formData.supplierName || undefined,
        status: 'open',
      });

      toast({
        title: "Cycle Created",
        description: `Production cycle has been created successfully.`,
      });

      navigate(`/cycles/${newCycle.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create cycle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.startDate && 
    parseFloat(formData.totalWeightKg) > 0 && 
    parseFloat(formData.costPerKg) > 0;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/cycles')}
          className="mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Cycles
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground">
          New Production Cycle
        </h1>
        <p className="text-muted-foreground mt-1">
          Start a new batch to track incoming rubber weight
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-primary" />
            Cycle Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Opened
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="h-14 text-lg"
                required
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <Package className="w-4 h-4" />
                Total Weight Received (kg)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.totalWeightKg}
                onChange={(e) => handleChange('totalWeightKg', e.target.value)}
                placeholder="e.g., 500"
                className="h-14 text-lg"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter the total weight of rubber received in this batch
              </p>
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cost per kg (GH₵)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPerKg}
                onChange={(e) => handleChange('costPerKg', e.target.value)}
                placeholder="e.g., 5.00"
                className="h-14 text-lg"
                required
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <User className="w-4 h-4" />
                Supplier Name (Optional)
              </label>
              <Input
                type="text"
                value={formData.supplierName}
                onChange={(e) => handleChange('supplierName', e.target.value)}
                placeholder="e.g., ABC Suppliers"
                className="h-14 text-lg"
              />
            </div>

            {/* Summary Preview */}
            {formData.totalWeightKg && formData.costPerKg && (
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-2">Cost Summary</h4>
                <p className="text-2xl font-bold text-primary">
                  GH₵ {(parseFloat(formData.totalWeightKg) * parseFloat(formData.costPerKg)).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total investment for this cycle
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/cycles')}
                className="flex-1 h-14 text-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex-1 h-14 text-lg"
              >
                {isSubmitting ? 'Creating...' : 'Create Cycle'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
