import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, User, MapPin, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function NewClient() {
  const navigate = useNavigate();
  const { addClient } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newClient = addClient({
        name: formData.name,
        location: formData.location,
        phone: formData.phone || undefined,
        notes: formData.notes || undefined,
      });

      toast({
        title: "Client Added",
        description: `${formData.name} has been added to your clients.`,
      });

      navigate(`/clients/${newClient.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.name.trim() && formData.location.trim();

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/clients')}
          className="mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Clients
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Add New Client
        </h1>
        <p className="text-muted-foreground mt-1">
          Register a new customer to your database
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label flex items-center gap-2">
                <User className="w-4 h-4" />
                Client Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Kumasi Rubber Works"
                className="h-14 text-lg"
                required
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location / Address *
              </label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Kumasi, Ashanti Region"
                className="h-14 text-lg"
                required
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="e.g., +233 24 123 4567"
                className="h-14 text-lg"
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes / Special Instructions
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any special instructions or notes about this client..."
                className="text-lg min-h-[120px]"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/clients')}
                className="flex-1 h-14 text-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex-1 h-14 text-lg"
              >
                {isSubmitting ? 'Adding...' : 'Add Client'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
