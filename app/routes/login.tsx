import { useState } from "react";
import type { Route } from "./+types/login";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { Loader2, Eye, EyeOff } from "lucide-react";
import WizardBackground from "../components/wizard/WizardBackground";
import Logo from "../welcome/logo_mini.png";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Luna Sites" },
    { name: "description", content: "Sign in to your Luna Sites account" },
  ];
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        window.location.href = "/sites";
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/sites";
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      setError(error.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  const canProceed = email.trim() !== '' && password.trim() !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="grid lg:grid-cols-[70%_30%] min-h-screen">
        {/* Left Panel - Login Form */}
        <div className="flex flex-col p-8 lg:p-16 overflow-y-auto">
          {/* Logo */}
          <a href="/" className="mb-8">
            <img src={Logo} alt="Luna Sites" className="h-10" />
          </a>

          <div className="flex-1 flex items-center justify-center">
          <div className="animate-in fade-in duration-500 mx-auto w-full" style={{ maxWidth: '525px' }}>
            <div className="mb-12 text-center">
              <h2 className="text-4xl mb-4 text-slate-900 font-bold">Welcome back</h2>
              <p className="text-slate-600 text-lg">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Signing you in...</h3>
                <p className="text-slate-600">This will only take a moment</p>
              </div>
            ) : (
              <>
                {/* Google Sign In Button */}
                <button
                  onClick={handleGoogleSignIn}
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

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 text-slate-500">
                      Or continue with email
                    </span>
                  </div>
                </div>

                <div className="space-y-6 mb-6">
                  <div>
                    <Label htmlFor="email" className="text-base font-semibold text-slate-900 mb-3 block">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        onChange={(e) => setPassword(e.target.value)}
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
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white mb-4 h-12"
                  onClick={handleEmailSignIn}
                  disabled={!canProceed}
                >
                  Sign In
                </Button>

                <div className="text-center">
                  <a
                    href="/signup"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Don't have an account? Create one
                  </a>
                </div>
              </>
            )}
          </div>
          </div>
        </div>

        {/* Right Panel - Nebula Background */}
        <div className="relative hidden lg:flex bg-white">
          <WizardBackground step={3} />
        </div>
      </div>
    </div>
  );
}
