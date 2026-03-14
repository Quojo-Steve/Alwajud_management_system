import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import { ArrowLeft, Truck, MapPin, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function NewSupplier() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', location: '', notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosService('post', '/supplier', {
        name: formData.name,
        phone: formData.phone || null,
        location: formData.location || null,
        notes: formData.notes || null,
      });
      toast({ title: "Supplier Added", description: `${formData.name} has been added.` });
      navigate('/suppliers');
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.detail || "Failed to add supplier.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/suppliers')} className="mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Suppliers
        </Button>
        <h1 className="text-3xl font-display font-bold">Add New Supplier</h1>
        <p className="text-muted-foreground mt-1">Register a supplier to track purchases and payments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Supplier Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label flex items-center gap-2">
                <Truck className="w-4 h-4" /> Supplier Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., ABC Rubber Supplies"
                className="h-14 text-lg"
                required
              />
            </div>
            <div>
              <label className="form-label flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g., Accra, Greater Accra"
                className="h-14 text-lg"
              />
            </div>
            <div>
              <label className="form-label flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone Number
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g., +233 24 123 4567"
                className="h-14 text-lg"
              />
            </div>
            <div>
              <label className="form-label flex items-center gap-2">
                <FileText className="w-4 h-4" /> Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Payment terms, special instructions..."
                className="text-lg min-h-[100px]"
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/suppliers')} className="flex-1 h-14 text-lg">
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.name.trim() || isSubmitting} className="flex-1 h-14 text-lg">
                {isSubmitting ? 'Adding...' : 'Add Supplier'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}