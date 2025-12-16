import { useState } from 'react';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import logo from 'figma:asset/1e2df6b5a066341b6419d0cf910c5e86038504d4.png';
import nebulaImg from 'figma:asset/0c3285ca46a22c90514c77bd00a3b2fc67ea516b.png';

interface LoginRegisterProps {
  onLogin: () => void;
}

export default function LoginRegister({ onLogin }: LoginRegisterProps) {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    // Simulate Google authentication
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 lg:relative lg:bg-transparent lg:border-0">
        <div className="w-full px-6 py-4 flex items-center justify-between lg:absolute lg:top-0 lg:left-0 lg:right-0 lg:z-10">
          <img src={logo} alt="Lunasites" className="h-10" />
          <Button 
            variant="ghost" 
            onClick={onLogin}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 pt-24 lg:pt-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-slate-900 mb-2">Signing you in...</h3>
            <p className="text-slate-600">This will only take a moment</p>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <div className="mb-12 text-center">
              <h2 className="text-4xl mb-4 text-slate-900">
                {isCreatingAccount ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-slate-600 text-lg">
                {isCreatingAccount 
                  ? 'Start building beautiful websites today' 
                  : 'Sign in to continue building'}
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full mb-6 px-6 py-3 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z" fill="#4285F4"/>
                <path d="M8.99976 18C11.4298 18 13.467 17.1941 14.9561 15.8195L12.0475 13.5613C11.2416 14.1013 10.2107 14.4204 8.99976 14.4204C6.65567 14.4204 4.67158 12.8372 3.96385 10.71H0.957031V13.0418C2.43794 15.9831 5.48158 18 8.99976 18Z" fill="#34A853"/>
                <path d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40665 3.78409 7.82983 3.96409 7.28983V4.95801H0.957273C0.347727 6.17301 0 7.54755 0 8.99983C0 10.4521 0.347727 11.8266 0.957273 13.0416L3.96409 10.7098Z" fill="#FBBC05"/>
                <path d="M8.99976 3.57955C10.3211 3.57955 11.5075 4.03364 12.4402 4.92545L15.0216 2.34409C13.4629 0.891818 11.4257 0 8.99976 0C5.48158 0 2.43794 2.01682 0.957031 4.95818L3.96385 7.29C4.67158 5.16273 6.65567 3.57955 8.99976 3.57955Z" fill="#EA4335"/>
              </svg>
              <span className="text-slate-900">Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 text-slate-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mb-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>

              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isCreatingAccount ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsCreatingAccount(!isCreatingAccount)}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                {isCreatingAccount 
                  ? 'Already have an account? Sign in' 
                  : 'Need an account? Create one'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Nebula Image */}
      <div className="relative hidden lg:flex lg:w-1/2">
        <img 
          src={nebulaImg} 
          alt="Cosmic nebula" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}