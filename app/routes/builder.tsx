import { useState } from "react";
import type { Route } from "./+types/builder";
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from "../components/ui/button";
import { api, validateSiteId, handleApiError } from "../lib/api";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { colorPalettes } from "../data/wizard-data";
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
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState('');
  const [siteId, setSiteId] = useState('');
  const [selectedPalette, setSelectedPalette] = useState<string>('purple-blue');
  const [selectedFont, setSelectedFont] = useState<string>('professional-1');
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
  const [error, setError] = useState<string | null>(null);
  const [siteIdError, setSiteIdError] = useState<string | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const totalSteps = 4;


  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
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

  const checkSiteAvailability = async (siteId: string) => {
    if (!siteId || validateSiteId(siteId)) return;

    setCheckingAvailability(true);
    try {
      const response = await api.checkSiteAvailability(siteId);
      if (!response.available) {
        setSiteIdError('This site ID is already taken');
      } else {
        setSiteIdError(null);
      }
    } catch (error) {
      console.error('Error checking site availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await handleCreateSite();
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to sign in with Google');
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

  const handleCreateSite = async () => {
    setIsCompleting(true);
    setError(null);

    try {
      const response = await api.createSite({
        site_id: siteId,
        name: siteTitle
      });

      if (response.success) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        window.location.href = "/sites";
      } else {
        setError(response.message || 'Failed to create site');
        setIsCompleting(false);
      }
    } catch (error) {
      console.error("Error creating site:", error);
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      setIsCompleting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedTemplate !== null;
      case 2: return selectedPalette !== null && selectedFont !== null;
      case 3: return siteTitle.trim() !== '' && siteId.trim() !== '' && !siteIdError && !checkingAvailability;
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
                selectedPalette={selectedPalette}
                selectedFont={selectedFont}
                selectedButtonStyle={selectedButtonStyle}
                selectedInputStyle={selectedInputStyle}
                expandedSection={expandedSection}
                currentColors={getCurrentColors()}
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
              />
            )}

            {/* Step 3: Site Name & URL */}
            {step === 3 && (
              <WizardStep3
                siteTitle={siteTitle}
                siteId={siteId}
                siteIdError={siteIdError}
                checkingAvailability={checkingAvailability}
                totalSteps={totalSteps}
                onSiteTitleChange={setSiteTitle}
                onSiteIdChange={handleSiteIdChange}
                onSiteIdBlur={() => checkSiteAvailability(siteId)}
              />
            )}

            {/* Step 4: Authentication */}
            {step === 4 && (
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

                {step < 4 && (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2"
                  >
                    Continue
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
                  selectedPalette={selectedPalette}
                  selectedFont={selectedFont}
                  selectedButtonStyle={selectedButtonStyle}
                  selectedInputStyle={selectedInputStyle}
                  expandedSection={expandedSection}
                  currentColors={getCurrentColors()}
                  onPaletteChange={(paletteId) => {
                    setSelectedPalette(paletteId);
                    setCustomColors([]);
                  }}
                  onFontChange={setSelectedFont}
                  onButtonStyleChange={setSelectedButtonStyle}
                  onInputStyleChange={setSelectedInputStyle}
                  onExpandSection={setExpandedSection}
                  onCustomColorChange={handleCustomColorChange}
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
