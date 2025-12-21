import { useState, useEffect, useRef } from "react";
import type { Route } from "./+types/builder";
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from "../components/ui/button";
import { validateSiteId, api } from "../lib/api";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { colorPalettes, fontPairs } from "../data/wizard-data";
import { useAuth } from "../contexts/AuthContext";
import WizardStep1 from "../components/wizard/WizardStep1";
import WizardStep2, { WizardStep2RightPanel } from "../components/wizard/WizardStep2";
import WizardStep3 from "../components/wizard/WizardStep3";
import WizardStep4 from "../components/wizard/WizardStep4";
import WizardProgress from "../components/wizard/WizardProgress";
import WizardBackground from "../components/wizard/WizardBackground";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Your Website - Luna Sites" },
    { name: "description", content: "Build your dream website with Luna Sites simple website builder." },
  ];
}

export default function Builder() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTemplateSiteId, setSelectedTemplateSiteId] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState('');
  const [siteId, setSiteId] = useState('');
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [selectedButtonStyle, setSelectedButtonStyle] = useState<string>('rounded');
  const [selectedInputStyle, setSelectedInputStyle] = useState<string>('rounded');
  const [baseFontSize, setBaseFontSize] = useState<number>(16);
  const [baseFontSizeMobile, setBaseFontSizeMobile] = useState<number>(14);
  const [error, setError] = useState<string | null>(null);
  const [siteIdError, setSiteIdError] = useState<string | null>(null);
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null);
  const [siteStatus, setSiteStatus] = useState<string>('creating');

  // If user is logged in, skip auth step (3 steps instead of 4)
  const isLoggedIn = !!user;
  const totalSteps = isLoggedIn ? 3 : 4;

  // Poll site status after creation
  useEffect(() => {
    if (!createdSiteId || !isCompleting) return;

    const pollStatus = async () => {
      try {
        const site = await api.getSite(createdSiteId);
        setSiteStatus(site.status);

        if (site.status === 'active') {
          // Save theme if user selected a palette or custom colors
          const hasCustomColors = customColors.length > 0;
          const hasSelectedPalette = selectedPalette !== null;

          if (hasCustomColors || hasSelectedPalette) {
            try {
              const colors = hasCustomColors
                ? customColors
                : colorPalettes.find(p => p.id === selectedPalette)?.colors || [];

              // Get selected font pair for typography
              const fontPair = fontPairs.find(f => f.id === selectedFont);

              await api.updateSiteTheme(createdSiteId, {
                presetId: selectedPalette || 'default',
                overrides: {
                  primary: colors[0] || '',
                  secondary: colors[1] || '',
                  accent: colors[2] || '',
                  background: colors[3] || '',
                },
                darkMode: false,
                typography: fontPair ? {
                  fontPresetId: fontPair.id,
                  fontHeading: fontPair.headingId,
                  fontBody: fontPair.bodyId,
                  baseFontSize,
                  baseFontSizeMobile,
                  headingWeight: fontPair.headingWeight,
                  bodyWeight: fontPair.bodyWeight,
                } : undefined,
              });
            } catch (err) {
              console.error('Failed to save theme:', err);
              // Continue anyway - theme save is not critical
            }
          }
          // Site is ready, redirect to edit page
          window.location.href = `/sites/${createdSiteId}/edit`;
        } else if (site.status === 'error') {
          setError('Failed to create site. Please try again.');
          setIsCompleting(false);
        }
      } catch (err) {
        console.error('Error polling site status:', err);
      }
    };

    // Poll immediately and then every 2 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [createdSiteId, isCompleting, customColors, selectedPalette, selectedFont, baseFontSize, baseFontSizeMobile]);


  const handleTemplateSelect = (templateId: string, sourceSiteId?: string) => {
    setSelectedTemplate(templateId);
    setSelectedTemplateSiteId(sourceSiteId || null);
    setStep(2);
  };

  const getCurrentColors = () => {
    if (customColors.length > 0) {
      return customColors;
    }
    return colorPalettes.find(p => p.id === selectedPalette)?.colors || [];
  };

  const handleCustomColorChange = (index: number, newColor: string) => {
    const currentColors = getCurrentColors();
    const updatedColors = [...currentColors];
    updatedColors[index] = newColor;
    setCustomColors(updatedColors);
  };

  const handleSiteIdChange = (id: string) => {
    const formatted = id.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSiteId(formatted);
    setSiteIdError(validateSiteId(formatted));
  };

  const handleNext = async () => {
    // If user is logged in and on step 3, create site directly
    if (isLoggedIn && step === 3) {
      setIsCompleting(true);
      await handleCreateSite();
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreateSite = async () => {
    try {
      setSiteStatus('creating');
      const result = await api.createSite({
        site_id: siteId,
        name: siteTitle,
        // Pass template ID if selected (not 'blank')
        template_id: selectedTemplate && selectedTemplate !== 'blank' ? selectedTemplate : undefined,
      });

      if (result.success) {
        // Start polling for site status
        setCreatedSiteId(siteId);
        setSiteStatus('pending');
      } else {
        throw new Error(result.message || 'Failed to create site');
      }
    } catch (error: any) {
      console.error('Site creation error:', error);
      setError(error.message || 'Failed to create site');
      setIsCompleting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsCompleting(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await handleCreateSite();
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to sign in with Google');
      setIsCompleting(false);
    }
  };

  const handleEmailAuth = async () => {
    try {
      setError(null);
      setIsCompleting(true);

      if (isCreatingAccount) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      await handleCreateSite();
    } catch (error: any) {
      console.error('Email auth error:', error);
      setError(error.message || 'Authentication failed');
      setIsCompleting(false);
    }
  };

  const getStatusMessage = () => {
    switch (siteStatus) {
      case 'creating':
        return { title: 'Creating your site...', subtitle: 'Setting everything up' };
      case 'pending':
        return { title: 'Preparing your site...', subtitle: 'Almost there' };
      case 'deploying':
        return { title: 'Publishing your site...', subtitle: 'Making it live' };
      case 'active':
        return { title: 'Your site is ready!', subtitle: 'Redirecting to editor...' };
      default:
        return { title: 'Creating your site...', subtitle: 'This will only take a moment' };
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedTemplate !== null;
      case 2: return selectedPalette !== null && selectedFont !== null;
      case 3: return siteTitle.trim() !== '' && siteId.trim() !== '' && !siteIdError;
      case 4:
        if (isCreatingAccount) {
          return firstName.trim() !== '' && lastName.trim() !== '' && email.trim() !== '' && password.trim() !== '' && confirmPassword.trim() !== '' && password === confirmPassword;
        }
        return email.trim() !== '' && password.trim() !== '';
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Step 1: Template Selection (Full Width) */}
      {step === 1 && (
        <WizardStep1
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onTemplateSelect={handleTemplateSelect}
          totalSteps={totalSteps}
        />
      )}

      {/* Steps 2-4: Standard Wizard Layout */}
      {step > 1 && (
        <div className="grid lg:grid-cols-[70%_30%] min-h-screen">
          {/* Left Panel - Form/Content */}
          <div className="flex flex-col p-8 lg:p-16 overflow-y-auto">
            <WizardProgress currentStep={step} totalSteps={totalSteps} />

            {/* Step 2: Style Selection */}
            {step === 2 && (
              <WizardStep2
                selectedTemplate={selectedTemplate}
                selectedTemplateSiteId={selectedTemplateSiteId}
                selectedPalette={selectedPalette}
                selectedFont={selectedFont}
                selectedButtonStyle={selectedButtonStyle}
                selectedInputStyle={selectedInputStyle}
                expandedSection={expandedSection}
                currentColors={getCurrentColors()}
                baseFontSize={baseFontSize}
                baseFontSizeMobile={baseFontSizeMobile}
                totalSteps={totalSteps}
                onPaletteChange={(paletteId) => {
                  setSelectedPalette(paletteId);
                  setCustomColors([]);
                }}
                onFontChange={setSelectedFont}
                onButtonStyleChange={setSelectedButtonStyle}
                onInputStyleChange={setSelectedInputStyle}
                onExpandSection={setExpandedSection}
                onCustomColorChange={handleCustomColorChange}
                onBaseFontSizeChange={setBaseFontSize}
                onBaseFontSizeMobileChange={setBaseFontSizeMobile}
              />
            )}

            {/* Step 3: Site Name & URL */}
            {step === 3 && (
              <WizardStep3
                siteTitle={siteTitle}
                siteId={siteId}
                siteIdError={siteIdError}
                checkingAvailability={false}
                totalSteps={totalSteps}
                onSiteTitleChange={setSiteTitle}
                onSiteIdChange={handleSiteIdChange}
                onSiteIdBlur={() => {}}
              />
            )}

            {/* Full-screen loading overlay with moon animation */}
            {isCompleting && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center">
                  {/* Moon animation */}
                  <div className="relative w-32 h-32 mx-auto mb-8">
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-xl animate-pulse" />
                    {/* Rotating orbit */}
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/40" />
                    </div>
                    {/* Moon icon */}
                    <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="url(#moonGradient)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-lg"
                      >
                        <defs>
                          <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#A855F7" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    </div>
                  </div>

                  {/* Status messages */}
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    {getStatusMessage().title}
                  </h3>
                  <p className="text-purple-200/80 mb-4">
                    {getStatusMessage().subtitle}
                  </p>

                  {/* Progress indicator */}
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>

                  {error && (
                    <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm max-w-md mx-auto">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Authentication (only for non-logged-in users) */}
            {!isLoggedIn && step === 4 && (
              <WizardStep4
                firstName={firstName}
                lastName={lastName}
                email={email}
                password={password}
                confirmPassword={confirmPassword}
                isCreatingAccount={isCreatingAccount}
                isCompleting={isCompleting}
                error={error}
                totalSteps={totalSteps}
                canProceed={canProceed()}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onToggleAccountMode={() => setIsCreatingAccount(!isCreatingAccount)}
                onGoogleSignIn={handleGoogleSignIn}
                onEmailAuth={handleEmailAuth}
              />
            )}

            {/* Navigation Buttons */}
            {!isCompleting && step > 1 && (
              <div className="flex items-center justify-between mt-12">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-3 h-12 px-6 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-900 font-medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </Button>

                {/* Show Continue button for steps before the final step */}
                {step < totalSteps && (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}

                {/* Show Create Site button on final step for logged-in users */}
                {isLoggedIn && step === totalSteps && (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white gap-2"
                  >
                    Create Site
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Style Selectors or Background Image */}
          <div className="relative hidden lg:flex bg-white">
            {step === 2 ? (
              <div className="w-full overflow-y-auto">
                <WizardStep2RightPanel
                  selectedTemplate={selectedTemplate}
                  selectedTemplateSiteId={selectedTemplateSiteId}
                  selectedPalette={selectedPalette}
                  selectedFont={selectedFont}
                  selectedButtonStyle={selectedButtonStyle}
                  selectedInputStyle={selectedInputStyle}
                  expandedSection={expandedSection}
                  currentColors={getCurrentColors()}
                  baseFontSize={baseFontSize}
                  baseFontSizeMobile={baseFontSizeMobile}
                  onPaletteChange={(paletteId) => {
                    setSelectedPalette(paletteId);
                    setCustomColors([]);
                  }}
                  onFontChange={setSelectedFont}
                  onButtonStyleChange={setSelectedButtonStyle}
                  onInputStyleChange={setSelectedInputStyle}
                  onExpandSection={setExpandedSection}
                  onCustomColorChange={handleCustomColorChange}
                  onBaseFontSizeChange={setBaseFontSize}
                  onBaseFontSizeMobileChange={setBaseFontSizeMobile}
                />
              </div>
            ) : (
              <WizardBackground step={step} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
