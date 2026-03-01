import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Factory, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a brief loading state
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid password. Please try again.');
      setPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Company Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent mb-6 shadow-gold">
            <Factory className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-display font-bold text-primary-foreground mb-2">
            ALWAJUD
          </h1>
          <p className="text-xl text-primary-foreground/80 font-display">
            VENTURES
          </p>
          <p className="text-primary-foreground/60 mt-2">
            Rubber Roll Factory Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl shadow-elevated p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-display font-bold text-foreground">
              Welcome Back
            </h2>
            <p className="text-muted-foreground mt-1">
              Enter your password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-12 h-14 text-lg"
                  autoFocus
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg font-semibold"
              disabled={isLoading || !password}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Enter'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Default password: <code className="bg-muted px-2 py-0.5 rounded">alwajud2024</code>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-primary-foreground/50 text-sm mt-8">
          © 2024 Alwajud Ventures. All rights reserved.
        </p>
      </div>
    </div>
  );
}
