import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Key } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-3xl font-display font-bold">Settings</h1>
      
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" />Change Password</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Contact your administrator to change the system password.</p>
          <p className="text-sm bg-muted p-3 rounded-lg">Current default: <code>alwajud2024</code></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><SettingsIcon className="w-5 h-5" />Company Info</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Company:</strong> Alwajud Ventures</p>
          <p><strong>Currency:</strong> GH₵ (Ghanaian Cedi)</p>
          <p><strong>Business:</strong> Rubber Roll Factory</p>
        </CardContent>
      </Card>
    </div>
  );
}
