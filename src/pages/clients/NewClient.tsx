import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Phone, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { axiosService } from '@/utils/axiosServices';

export default function NewClient() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    notes: '',
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file)); // show preview
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('location', formData.location);
      if (formData.phone) payload.append('phone', formData.phone);
      if (formData.notes) payload.append('description', formData.notes);
      if (logoFile) payload.append('logo', logoFile);

      const res = await axiosService('post', '/client', payload);

      toast({
        title: "Client Added",
        description: `${formData.name} has been added to your clients.`,
      });

      navigate('/clients');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to add client. Please try again.",
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
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/clients')} className="mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Clients
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground">Add New Client</h1>
        <p className="text-muted-foreground mt-1">Register a new customer to your database</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Logo Upload */}
            <div>
              <label className="form-label flex items-center gap-2">
                <Image className="w-4 h-4" />
                Logo (optional)
              </label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-16 h-16 rounded-full object-cover border"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="h-14 text-lg"
                />
              </div>
            </div>

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