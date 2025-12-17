import { useState } from "react";
import type { Route } from "./+types/builder";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import UserProfile from "../components/UserProfile";
import { api, validateSiteId, validateSiteName, handleApiError } from "../lib/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Your Website - Luna Sites" },
    { name: "description", content: "Build your dream website with Luna Sites' simple website builder." },
  ];
}

export default function Builder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [siteName, setSiteName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("plain-luna-sites");
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteIdError, setSiteIdError] = useState<string | null>(null);
  const [siteNameError, setSiteNameError] = useState<string | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const { user } = useAuth();

  const generateSiteId = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 50);
  };

  const handleSiteNameChange = (name: string) => {
    setSiteName(name);
    setSiteNameError(validateSiteName(name));
    if (name) {
      setSiteId(generateSiteId(name));
    }
  };

  const handleSiteIdChange = (id: string) => {
    setSiteId(id);
    setSiteIdError(validateSiteId(id));
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

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateSite = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Validate inputs
    const siteNameValidation = validateSiteName(siteName);
    const siteIdValidation = validateSiteId(siteId);
    
    if (siteNameValidation || siteIdValidation) {
      setSiteNameError(siteNameValidation);
      setSiteIdError(siteIdValidation);
      return;
    }
    
    setCreating(true);
    setError(null);
    
    try {
      // Check availability one more time
      const availabilityResponse = await api.checkSiteAvailability(siteId);
      if (!availabilityResponse.available) {
        setSiteIdError('This site ID is already taken');
        return;
      }
      
      const response = await api.createSite({
        site_id: siteId,
        name: siteName
      });
      
      if (response.success) {
        alert("Site created successfully!");
        window.location.href = "/sites";
      } else {
        setError(response.message || 'Failed to create site');
      }
    } catch (error) {
      console.error("Error creating site:", error);
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleAuthSuccess = async () => {
    // After successful authentication, create the site
    if (user) {
      await handleCreateSite();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-[#0052de]">Luna Sites</a>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Step {currentStep} of 4
              </div>
              {user && <UserProfile />}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{currentStep}/4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#0052de] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Theme Selection */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Theme</h2>
            <p className="text-gray-600 mb-8">Select a theme that matches your vision. You can customize it later.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedTheme === "plain-luna-sites" 
                    ? "border-[#0052de] bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedTheme("plain-luna-sites")}
              >
                <div className="aspect-video bg-gradient-to-br from-[#0052de] to-blue-700 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="w-8 h-8 bg-white/20 rounded mx-auto mb-2"></div>
                    <div className="text-xs">Plain Luna Sites</div>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Plain Luna Sites</h3>
                <p className="text-sm text-gray-600">Clean and professional theme perfect for any business</p>
                <div className="mt-4 flex items-center">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Free
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-[#0052de] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Site Name & ID */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Name Your Site</h2>
            <p className="text-gray-600 mb-8">Choose a name for your website. This will be used for your site URL.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => handleSiteNameChange(e.target.value)}
                  placeholder="My Amazing Website"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0052de] focus:border-transparent outline-none ${
                    siteNameError ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {siteNameError && (
                  <p className="text-red-500 text-sm mt-1">{siteNameError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site ID (URL)
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={siteId}
                    onChange={(e) => handleSiteIdChange(e.target.value)}
                    onBlur={() => checkSiteAvailability(siteId)}
                    className={`flex-1 px-4 py-3 border rounded-l-lg focus:ring-2 focus:ring-[#0052de] focus:border-transparent outline-none ${
                      siteIdError ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <div className="px-4 py-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                    .luna-sites.com
                  </div>
                </div>
                {checkingAvailability && (
                  <p className="text-blue-500 text-sm mt-1">Checking availability...</p>
                )}
                {siteIdError && (
                  <p className="text-red-500 text-sm mt-1">{siteIdError}</p>
                )}
                {!siteIdError && siteId && !checkingAvailability && (
                  <p className="text-green-500 text-sm mt-1">Available!</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Your site will be available at: <span className="font-medium">{siteId || "your-site-id"}.luna-sites.com</span>
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!siteName || !siteId || !!siteNameError || !!siteIdError || checkingAvailability}
                className="px-6 py-3 bg-[#0052de] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Extensions */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Extensions</h2>
            <p className="text-gray-600 mb-8">Add extra functionality to your site. You can always add more later.</p>
            
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Extensions Coming Soon</h3>
              <p className="text-gray-600">
                We're working on exciting extensions like contact forms, galleries, e-commerce, and more.
              </p>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-[#0052de] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Preview Your Site</h2>
            <p className="text-gray-600 mb-8">Here's how your site will look and where it will be accessible.</p>
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Site Preview</h3>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4">
                  <div className="aspect-video bg-gradient-to-br from-[#0052de] to-blue-700 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <h4 className="text-2xl font-bold mb-2">{siteName || "Your Site Name"}</h4>
                      <p className="text-blue-100">Welcome to your new website!</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="font-medium text-green-800">Your site URL:</span>
                  </div>
                  <p className="text-lg font-bold text-green-700 mt-1">
                    {siteId || "your-site-id"}.luna-sites.com
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Site Details</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Site Name:</dt>
                    <dd className="font-medium">{siteName || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Theme:</dt>
                    <dd className="font-medium">Plain Luna Sites</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">URL:</dt>
                    <dd className="font-medium">{siteId || "not-set"}.luna-sites.com</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Extensions:</dt>
                    <dd className="font-medium">None selected</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={handleCreateSite}
                disabled={creating}
                className="px-8 py-3 bg-gradient-to-r from-[#0052de] to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg disabled:opacity-50"
              >
                {creating ? 'Creating...' : (user ? 'Create Site' : 'Create Account & Site')}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}