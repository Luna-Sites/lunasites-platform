import { useState } from "react";
import type { Route } from "./+types/signup";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
import { Loader2, Mail, Eye, EyeOff } from "lucide-react";
import WizardBackground from "../components/wizard/WizardBackground";
const Logo = "/logo/logo_lunasites_gradient.png";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Account - Luna Sites" },
    { name: "description", content: "Create your Luna Sites account" },
  ];
}

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [noEmails, setNoEmails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoogleSignUp = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        window.location.href = "/sites";
      }
    } catch (error: any) {
      console.error('Google sign-up error:', error);
      setError(error.message || 'Failed to sign up with Google');
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      window.location.href = "/sites";
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(error.message || 'Failed to create account');
      }
      setIsLoading(false);
    }
  };

  const canProceed = firstName.trim() !== '' && lastName.trim() !== '' && email.trim() !== '' && password.trim() !== '' && confirmPassword.trim() !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="grid lg:grid-cols-[70%_30%] min-h-screen">
        {/* Left Panel - Signup Form */}
        <div className="flex flex-col p-8 lg:p-16 overflow-y-auto">
          {/* Logo */}
          <a href="/" className="mb-4">
            <img src={Logo} alt="Luna Sites" className="w-[130px]" />
          </a>

          <div className="flex-1 flex items-center justify-center">
          <div className="animate-in fade-in duration-500 mx-auto w-full" style={{ maxWidth: '525px' }}>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5A318F] to-[#D920B7] flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Creating your account...</h3>
            <p className="text-slate-600">This will only take a moment</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-3xl mb-2 text-slate-900 font-bold">Create your account</h2>
              <p className="text-slate-600 text-sm">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-slate-700 underline hover:text-slate-900">Terms of Service</a>
                {' '}and have read and understood the{' '}
                <a href="/privacy" className="text-slate-700 underline hover:text-slate-900">Privacy Policy</a>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email preference checkbox */}
            <div className="flex items-start gap-3 mb-4 p-2.5 border border-slate-200 rounded-lg">
              <input
                type="checkbox"
                id="no-emails"
                checked={noEmails}
                onChange={(e) => setNoEmails(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#5A318F] focus:ring-[#5A318F]"
              />
              <label htmlFor="no-emails" className="text-sm text-[#5A318F] cursor-pointer">
                I do not want to receive emails about new features and products
              </label>
            </div>

            {/* Google Sign Up Button */}
            <button
              onClick={handleGoogleSignUp}
              className="w-full mb-3 px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-3 font-medium"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z" fill="#4285F4"/>
                <path d="M8.99976 18C11.4298 18 13.467 17.1941 14.9561 15.8195L12.0475 13.5613C11.2416 14.1013 10.2107 14.4204 8.99976 14.4204C6.65567 14.4204 4.67158 12.8372 3.96385 10.71H0.957031V13.0418C2.43794 15.9831 5.48158 18 8.99976 18Z" fill="#34A853"/>
                <path d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40665 3.78409 7.82983 3.96409 7.28983V4.95801H0.957273C0.347727 6.17301 0 7.54755 0 8.99983C0 10.4521 0.347727 11.8266 0.957273 13.0416L3.96409 10.7098Z" fill="#FBBC05"/>
                <path d="M8.99976 3.57955C10.3211 3.57955 11.5075 4.03364 12.4402 4.92545L15.0216 2.34409C13.4629 0.891818 11.4257 0 8.99976 0C5.48158 0 2.43794 2.01682 0.957031 4.95818L3.96385 7.29C4.67158 5.16273 6.65567 3.57955 8.99976 3.57955Z" fill="#EA4335"/>
              </svg>
              <span className="text-slate-900">Continue with Google</span>
            </button>

            {/* Email Sign Up Button */}
            <button
              onClick={() => setShowEmailForm(!showEmailForm)}
              className="w-full mb-4 px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-3 font-medium"
            >
              <Mail className="w-5 h-5" />
              <span className="text-slate-900">Continue with Email</span>
            </button>

            {/* Email Form (expandable) */}
            {showEmailForm && (
              <div className="mb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-semibold text-slate-900 mb-1.5 block">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 px-3 text-sm bg-slate-50 border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-semibold text-slate-900 mb-1.5 block">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 px-3 text-sm bg-slate-50 border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-900 mb-1.5 block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 px-3 text-sm bg-slate-50 border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-900 mb-1.5 block">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 px-3 pr-10 text-sm bg-slate-50 border-slate-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirm-password" className="text-sm font-semibold text-slate-900 mb-1.5 block">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 px-3 pr-10 text-sm bg-slate-50 border-slate-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white h-11"
                  onClick={handleEmailSignUp}
                  disabled={!canProceed}
                >
                  Create Account
                </Button>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-slate-400 mt-4">
              <p>
                <a href="/terms" className="text-slate-500 underline hover:text-slate-700">Terms</a>
                {' & '}
                <a href="/privacy" className="text-slate-500 underline hover:text-slate-700">Privacy</a>
              </p>
            </div>

            {/* Already have account link */}
            <div className="text-center mt-4 pt-4 border-t border-slate-200">
              <a
                href="/login"
                className="text-sm text-[#5A318F] hover:text-[#4A2875] font-medium"
              >
                Already have an account? Sign in
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
