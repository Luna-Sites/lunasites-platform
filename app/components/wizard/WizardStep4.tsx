import { useState } from 'react';
import { Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface WizardStep4Props {
  email: string;
  password: string;
  isCreatingAccount: boolean;
  isCompleting: boolean;
  error: string | null;
  totalSteps: number;
  canProceed: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onToggleAccountMode: () => void;
  onGoogleSignIn: () => void;
  onEmailAuth: () => void;
}

export default function WizardStep4({
  email,
  password,
  isCreatingAccount,
  isCompleting,
  error,
  totalSteps,
  canProceed,
  onEmailChange,
  onPasswordChange,
  onToggleAccountMode,
  onGoogleSignIn,
  onEmailAuth
}: WizardStep4Props) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="animate-in fade-in duration-500 max-w-md mx-auto">
      {isCompleting ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Setting up your website...</h3>
          <p className="text-slate-600">This will only take a moment</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-2 text-xs text-slate-500 tracking-wide">STEP 4 OF {totalSteps}</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {isCreatingAccount ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-slate-500">
              {isCreatingAccount ? (
                <>
                  By creating an account, you agree to our{' '}
                  <a href="/terms" className="text-slate-700 underline hover:text-slate-900">Terms of Service</a>
                  <br />
                  and have read and understood the{' '}
                  <a href="/privacy" className="text-slate-700 underline hover:text-slate-900">Privacy Policy</a>
                </>
              ) : (
                'Sign in to continue building your website'
              )}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={onGoogleSignIn}
            className="w-full mb-6 px-6 py-3 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-3 font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z" fill="#4285F4"/>
              <path d="M8.99976 18C11.4298 18 13.467 17.1941 14.9561 15.8195L12.0475 13.5613C11.2416 14.1013 10.2107 14.4204 8.99976 14.4204C6.65567 14.4204 4.67158 12.8372 3.96385 10.71H0.957031V13.0418C2.43794 15.9831 5.48158 18 8.99976 18Z" fill="#34A853"/>
              <path d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40665 3.78409 7.82983 3.96409 7.28983V4.95801H0.957273C0.347727 6.17301 0 7.54755 0 8.99983C0 10.4521 0.347727 11.8266 0.957273 13.0416L3.96409 10.7098Z" fill="#FBBC05"/>
              <path d="M8.99976 3.57955C10.3211 3.57955 11.5075 4.03364 12.4402 4.92545L15.0216 2.34409C13.4629 0.891818 11.4257 0 8.99976 0C5.48158 0 2.43794 2.01682 0.957031 4.95818L3.96385 7.29C4.67158 5.16273 6.65567 3.57955 8.99976 3.57955Z" fill="#EA4335"/>
            </svg>
            <span className="text-slate-900">Continue with Google</span>
          </button>

          {/* Email Sign In/Up Button */}
          <button
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="w-full mb-6 px-6 py-3 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-3 font-medium"
          >
            <Mail className="w-5 h-5" />
            <span className="text-slate-900">Continue with Email</span>
          </button>

          {/* Email Form (expandable) */}
          {showEmailForm && (
            <div className="mb-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
              <div>
                <Label htmlFor="email" className="text-base font-semibold text-slate-900 mb-3 block">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  className="h-14 px-4 text-base bg-slate-50 border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-base font-semibold text-slate-900 mb-3 block">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    className="h-14 px-4 pr-12 text-base bg-slate-50 border-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-12"
                onClick={onEmailAuth}
                disabled={!canProceed}
              >
                {isCreatingAccount ? 'Create Account & Launch Site' : 'Sign In'}
              </Button>
            </div>
          )}

          {/* Toggle account mode link */}
          <div className="text-center">
            <button
              onClick={onToggleAccountMode}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {isCreatingAccount
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
