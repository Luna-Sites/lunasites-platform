import { useState } from 'react';
import { 
  Briefcase, 
  Heart,
  Camera,
  Store,
  FileText,
  Calendar,
  Palette,
  Utensils,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  BarChart3,
  Package,
  ShoppingCart,
  Mail,
  Loader2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import logo from 'figma:asset/1e2df6b5a066341b6419d0cf910c5e86038504d4.png';
import portfolioImg from 'figma:asset/cadb01d5f39257b9bed043b110f35314dd1c3305.png';
import restaurantImg from 'figma:asset/b23bd12188c3ef947fd6b1b0bbe43fd80fbfc342.png';
import shopImg from 'figma:asset/71307606acb6787b5e76de625a8ec65231dd9256.png';
import blogImg from 'figma:asset/041cf6f3cefd4852af7111701a69ab2fdd52620e.png';
import eventImg from 'figma:asset/76d3c409747ba05034bcb396ba101e021e656b6e.png';
import img6 from 'figma:asset/f2b6ee8458f1f24edd1158a6df9bdc487e1e99a2.png';
import nebulaImg from 'figma:asset/0c3285ca46a22c90514c77bd00a3b2fc67ea516b.png';
import nebulaStep3Img from 'figma:asset/caad2fb66ee13072925944451b9524e8de8b5c3d.png';

interface WizardProps {
  onComplete: () => void;
}

export default function Wizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState('');
  const [siteId, setSiteId] = useState('');
  const [selectedPalette, setSelectedPalette] = useState<string>('purple-blue');
  const [selectedFont, setSelectedFont] = useState<string>('professional-1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [selectedButtonStyle, setSelectedButtonStyle] = useState<string>('rounded');
  const [selectedInputStyle, setSelectedInputStyle] = useState<string>('rounded');

  const totalSteps = 4;

  const categories = [
    { id: 'popular', name: 'Popular Topics', icon: Heart },
    { id: 'portfolio', name: 'Portfolio', icon: Briefcase },
    { id: 'business', name: 'Business', icon: Briefcase },
    { id: 'photography', name: 'Photography', icon: Camera },
    { id: 'restaurant', name: 'Restaurant & Food', icon: Utensils },
    { id: 'ecommerce', name: 'E-commerce', icon: Store },
    { id: 'blog', name: 'Blog & Writing', icon: FileText },
    { id: 'events', name: 'Events', icon: Calendar },
    { id: 'creative', name: 'Creative & Arts', icon: Palette },
  ];

  const templates = [
    {
      id: 'portfolio-1',
      name: 'Modern Portfolio',
      category: 'portfolio',
      image: portfolioImg,
      description: 'Showcase your work beautifully'
    },
    {
      id: 'business-1',
      name: 'Business Pro',
      category: 'business',
      image: img6,
      description: 'Professional business presence'
    },
    {
      id: 'restaurant-1',
      name: 'Tasty Bites',
      category: 'restaurant',
      image: restaurantImg,
      description: 'Elegant restaurant website'
    },
    {
      id: 'shop-1',
      name: 'Shop Modern',
      category: 'ecommerce',
      image: shopImg,
      description: 'Beautiful online store'
    },
    {
      id: 'blog-1',
      name: 'Story Teller',
      category: 'blog',
      image: blogImg,
      description: 'Share your stories'
    },
    {
      id: 'events-1',
      name: 'Event Magic',
      category: 'events',
      image: eventImg,
      description: 'Stunning event pages'
    },
  ];

  const colorPalettes = [
    { id: 'purple-blue', name: 'Purple & Blue', colors: ['#8B5CF6', '#3B82F6', '#0EA5E9'] },
    { id: 'emerald-teal', name: 'Emerald & Teal', colors: ['#10B981', '#14B8A6', '#06B6D4'] },
    { id: 'rose-pink', name: 'Rose & Pink', colors: ['#F43F5E', '#EC4899', '#A855F7'] },
    { id: 'orange-amber', name: 'Orange & Amber', colors: ['#F97316', '#F59E0B', '#EAB308'] },
    { id: 'slate-blue', name: 'Slate & Blue', colors: ['#475569', '#3B82F6', '#1E293B'] },
    { id: 'monochrome', name: 'Monochrome', colors: ['#1F2937', '#6B7280', '#F3F4F6'] },
    { id: 'forest-moss', name: 'Forest & Moss', colors: ['#059669', '#65A30D', '#15803D'] },
    { id: 'sunset', name: 'Sunset', colors: ['#DC2626', '#EA580C', '#FBBF24'] }
  ];

  const fontPairs = [
    { 
      id: 'professional-1', 
      category: 'Professional',
      name: 'Inter & Roboto', 
      heading: 'Inter', 
      body: 'Roboto',
      recommended: true
    },
    { 
      id: 'professional-2', 
      category: 'Professional',
      name: 'Lora & Open Sans', 
      heading: 'Lora', 
      body: 'Open Sans',
      recommended: false
    },
    { 
      id: 'playful-1', 
      category: 'Playful',
      name: 'Fredoka & Inter', 
      heading: 'Fredoka', 
      body: 'Inter',
      recommended: false
    },
    { 
      id: 'playful-2', 
      category: 'Playful',
      name: 'Quicksand & Work Sans', 
      heading: 'Quicksand', 
      body: 'Work Sans',
      recommended: false
    },
    { 
      id: 'sophisticated-1', 
      category: 'Sophisticated',
      name: 'Playfair Display & Lato', 
      heading: 'Playfair Display', 
      body: 'Lato',
      recommended: false
    },
    { 
      id: 'sophisticated-2', 
      category: 'Sophisticated',
      name: 'Cormorant & Source Sans', 
      heading: 'Cormorant', 
      body: 'Source Sans',
      recommended: false
    },
    { 
      id: 'friendly-1', 
      category: 'Friendly',
      name: 'Nunito & Open Sans', 
      heading: 'Nunito', 
      body: 'Open Sans',
      recommended: false
    },
    { 
      id: 'friendly-2', 
      category: 'Friendly',
      name: 'Poppins & Roboto', 
      heading: 'Poppins', 
      body: 'Roboto',
      recommended: false
    },
    { 
      id: 'bold-1', 
      category: 'Bold',
      name: 'Bebas Neue & Roboto', 
      heading: 'Bebas Neue', 
      body: 'Roboto',
      recommended: false
    },
    { 
      id: 'bold-2', 
      category: 'Bold',
      name: 'Oswald & Lato', 
      heading: 'Oswald', 
      body: 'Lato',
      recommended: false
    }
  ];

  const addons = [
    { id: 'seo', name: 'SEO Tools', icon: Search, description: 'Optimize for search engines' },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, description: 'Track visitor behavior' },
    { id: 'blog', name: 'Blog Module', icon: FileText, description: 'Publishing platform' },
    { id: 'media', name: 'Media Library', icon: Package, description: 'Advanced media management' },
    { id: 'ecommerce', name: 'E-commerce Tools', icon: ShoppingCart, description: 'Sell products online' },
    { id: 'forms', name: 'Forms Builder', icon: Mail, description: 'Custom form creation' }
  ];

  const buttonStyles = [
    { id: 'rounded', name: 'Rounded', borderRadius: '0.5rem' },
    { id: 'soft', name: 'Soft Rounded', borderRadius: '0.75rem' },
    { id: 'pill', name: 'Pill', borderRadius: '9999px' },
    { id: 'sharp', name: 'Sharp', borderRadius: '0px' },
    { id: 'minimal', name: 'Minimal Rounded', borderRadius: '0.25rem' }
  ];

  const inputStyles = [
    { id: 'rounded', name: 'Rounded', borderRadius: '0.5rem', border: '1px solid #cbd5e1' },
    { id: 'soft', name: 'Soft Rounded', borderRadius: '0.75rem', border: '1px solid #cbd5e1' },
    { id: 'sharp', name: 'Sharp', borderRadius: '0px', border: '1px solid #cbd5e1' },
    { id: 'minimal', name: 'Minimal Rounded', borderRadius: '0.25rem', border: '1px solid #cbd5e1' },
    { id: 'underline', name: 'Underline', borderRadius: '0px', border: 'none', borderBottom: '2px solid #cbd5e1' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'popular' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setStep(2);
  };

  // Initialize custom colors from selected palette
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

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onComplete();
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedTemplate !== null;
      case 2: return selectedPalette !== null && selectedFont !== null;
      case 3: return siteTitle.trim() !== '' && siteId.trim() !== '';
      case 4: return email.trim() !== '' && password.trim() !== '';
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Step 1: Template Selection (Full Width) */}
      {step === 1 && (
        <div className="min-h-screen p-8 lg:p-16">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 text-center">
              <button onClick={() => onComplete()} className="text-sm text-slate-500 hover:text-slate-700 mb-8 flex items-center gap-2 mx-auto">
                ← Back to Home
              </button>
              <div className="mb-2 text-xs text-slate-500 tracking-wide">STEP 1 OF {totalSteps}</div>
              <h1 className="text-4xl mb-3 text-slate-900">Choose your starting point</h1>
              <p className="text-slate-600 mb-8">
                Select a template to customize or start with a blank canvas
              </p>

              {/* Category Select and Blank Canvas - Same Row */}
              <div className="flex flex-col md:flex-row gap-4 items-stretch mb-12">
                {/* Category Select - Left */}
                <div className="flex-1">
                  <select
                    value={selectedCategory || 'popular'}
                    onChange={(e) => setSelectedCategory(e.target.value === 'popular' ? null : e.target.value)}
                    className="w-full h-full px-6 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 hover:border-purple-300 focus:border-purple-500 focus:outline-none transition-all cursor-pointer"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Blank Canvas Button - Right */}
                <button
                  onClick={() => handleTemplateSelect('blank')}
                  className="flex-1 p-6 rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-slate-900 mb-1">Start with Blank Canvas</div>
                      <div className="text-sm text-slate-600">Build your website from scratch</div>
                    </div>
                    <ArrowRight className="size-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>

            {/* Templates Grid - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all hover:scale-105"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={template.image}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 text-left">
                    <div className="text-slate-900 mb-1">{template.name}</div>
                    <div className="text-sm text-slate-600">{template.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Steps 2-6: Standard Wizard Layout */}
      {step > 1 && (
        <div className="grid lg:grid-cols-[70%_30%] min-h-screen">
          {/* Left Panel - Form/Content */}
          <div className="flex flex-col p-8 lg:p-16 overflow-y-auto">
            {/* Progress Bar */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="Lunasites" className="h-20" />
                </div>
                <span className="text-sm text-slate-500">Step {step} of {totalSteps}</span>
              </div>
              
              <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 2: Style Selection (Colors + Fonts) - Template Preview */}
            {step === 2 && (
              <div className="animate-in fade-in duration-500">
                <div className="mb-8">
                  <div className="mb-2 text-xs text-slate-500 tracking-wide">STEP 2 OF {totalSteps}</div>
                  <h2 className="text-4xl mb-4 text-slate-900">Choose your style</h2>
                  <p className="text-slate-600 text-lg">Pick colors and fonts that match your vision</p>
                </div>

                {/* Template Preview with Selected Colors & Fonts */}
                <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200">
                  {selectedTemplate === 'blank' ? (
                    <div className="aspect-[16/10] bg-white flex flex-col items-center justify-center p-12">
                      <div className="text-center space-y-6 max-w-xl">
                        <div 
                          style={{ 
                            color: getCurrentColors()[0],
                            fontFamily: fontPairs.find(f => f.id === selectedFont)?.heading,
                            fontSize: '48px',
                            lineHeight: '1.2',
                            marginBottom: '16px'
                          }}
                        >
                          Your Website Title
                        </div>
                        <p 
                          style={{ 
                            color: getCurrentColors()[1],
                            fontFamily: fontPairs.find(f => f.id === selectedFont)?.body,
                            fontSize: '18px',
                            lineHeight: '1.6'
                          }}
                        >
                          This is where your content will go. Choose colors and fonts that represent your brand and style.
                        </p>
                        <div className="flex gap-4 justify-center">
                          <div 
                            className="px-6 py-3 rounded-lg text-white"
                            style={{ 
                              backgroundColor: getCurrentColors()[0],
                              fontFamily: fontPairs.find(f => f.id === selectedFont)?.body,
                              borderRadius: buttonStyles.find(s => s.id === selectedButtonStyle)?.borderRadius
                            }}
                          >
                            Primary Button
                          </div>
                          <div 
                            className="px-6 py-3 rounded-lg text-white"
                            style={{ 
                              backgroundColor: getCurrentColors()[1],
                              fontFamily: fontPairs.find(f => f.id === selectedFont)?.body,
                              borderRadius: buttonStyles.find(s => s.id === selectedButtonStyle)?.borderRadius
                            }}
                          >
                            Secondary Button
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={templates.find(t => t.id === selectedTemplate)?.image} 
                        alt="Template preview"
                        className="w-full aspect-[16/10] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" 
                        style={{
                          background: `linear-gradient(135deg, ${getCurrentColors()[0]}15 0%, ${getCurrentColors()[1]}25 100%)`
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
                        <div 
                          className="text-white mb-4"
                          style={{
                            fontFamily: fontPairs.find(f => f.id === selectedFont)?.heading,
                            fontSize: '32px',
                            lineHeight: '1.2'
                          }}
                        >
                          {templates.find(t => t.id === selectedTemplate)?.name}
                        </div>
                        <div className="flex gap-3">
                          {getCurrentColors().map((color, index) => (
                            <div 
                              key={index}
                              className="w-12 h-12 rounded-lg shadow-lg"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Site Name & URL */}
            {step === 3 && (
              <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
                <div className="mb-12 text-center">
                  <div className="mb-2 text-xs text-slate-500 tracking-wide">STEP 3 OF {totalSteps}</div>
                  <h2 className="text-4xl mb-4 text-slate-900">Name your website</h2>
                  <p className="text-slate-600 text-lg">Choose a title and URL for your site</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="site-title">Site Title</Label>
                    <Input
                      id="site-title"
                      placeholder="My Awesome Website"
                      value={siteTitle}
                      onChange={(e) => setSiteTitle(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="site-id">Site ID (URL)</Label>
                    <Input
                      id="site-id"
                      placeholder="my-awesome-site"
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="mt-2"
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      Your site will be available at: <span className="text-purple-600">{siteId || 'your-site'}.lunaweb.app</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Login/Register */}
            {step === 4 && (
              <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
                <div className="mb-12 text-center">
                  <div className="mb-2 text-xs text-slate-500 tracking-wide">STEP 4 OF {totalSteps}</div>
                  <h2 className="text-4xl mb-4 text-slate-900">
                    {isCreatingAccount ? 'Create your account' : 'Welcome back'}
                  </h2>
                  <p className="text-slate-600 text-lg">
                    {isCreatingAccount 
                      ? 'Just one more step to launch your website' 
                      : 'Sign in to continue building'}
                  </p>
                </div>

                {isCompleting ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-slate-900 mb-2">Setting up your website...</h3>
                    <p className="text-slate-600">This will only take a moment</p>
                  </div>
                ) : (
                  <>
                    {/* Google Sign In Button */}
                    <button
                      onClick={() => {
                        // Handle Google sign in
                        handleComplete();
                      }}
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

                    <div className="space-y-6 mb-6">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
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
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 mb-4"
                      onClick={handleComplete}
                      disabled={!canProceed()}
                    >
                      {isCreatingAccount ? 'Create Account & Launch Site' : 'Sign In'}
                    </Button>

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
                  </>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            {!isCompleting && (
              <div className="flex items-center justify-between mt-12">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
                >
                  {step === totalSteps ? 'Complete' : 'Continue'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel - Style Selectors or Abstract Image */}
          <div className={`relative ${step === 2 ? 'p-8 lg:p-16' : ''} hidden lg:flex overflow-y-auto bg-white`}>
            {step === 2 ? (
              <div className="flex flex-col w-full">
                <h2 className="text-2xl text-slate-900 mb-6">Site Styles</h2>
                
                <div className="space-y-4">
                  {/* Themes Section */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'themes' ? null : 'themes')}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-sm text-slate-600">Themes</span>
                      {expandedSection === 'themes' ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    
                    {/* Themes Preview (Always Visible) */}
                    <div className="px-4 pb-4">
                      <div className="bg-slate-200 rounded-lg p-4 flex items-center gap-3">
                        <div 
                          className="text-3xl"
                          style={{ 
                            fontFamily: fontPairs.find(f => f.id === selectedFont)?.heading 
                          }}
                        >
                          Aa
                        </div>
                        <div className="flex gap-2">
                          {colorPalettes.find(p => p.id === selectedPalette)?.colors.slice(0, 3).map((color, index) => (
                            <div 
                              key={index}
                              className="w-8 h-8 rounded"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div 
                          className="ml-auto px-4 py-1.5 rounded-full text-white text-xs"
                          style={{ 
                            backgroundColor: colorPalettes.find(p => p.id === selectedPalette)?.colors[0] 
                          }}
                        >
                          BUTTON
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Themes Content */}
                    {expandedSection === 'themes' && (
                      <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
                        {colorPalettes.map((palette) => (
                          <button
                            key={palette.id}
                            onClick={() => {
                              setSelectedPalette(palette.id);
                              setExpandedSection(null);
                            }}
                            className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                              selectedPalette === palette.id
                                ? 'border-purple-500 bg-white'
                                : 'border-transparent bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1.5">
                                {palette.colors.map((color, index) => (
                                  <div
                                    key={index}
                                    className="w-8 h-8 rounded shadow-sm"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-slate-700 flex-1 text-left">{palette.name}</p>
                              {selectedPalette === palette.id && (
                                <Check className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fonts Section */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'fonts' ? null : 'fonts')}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-sm text-slate-600">Fonts</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    {/* Fonts Preview (Always Visible) */}
                    <div className="px-4 pb-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div 
                          className="text-xl text-slate-900 mb-1"
                          style={{ 
                            fontFamily: fontPairs.find(f => f.id === selectedFont)?.heading 
                          }}
                        >
                          Heading
                        </div>
                        <p 
                          className="text-sm text-slate-600"
                          style={{ 
                            fontFamily: fontPairs.find(f => f.id === selectedFont)?.body 
                          }}
                        >
                          This is your paragraph.
                        </p>
                      </div>
                    </div>
                    
                    {/* Expanded Fonts Content */}
                    {expandedSection === 'fonts' && (
                      <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
                        {fontPairs.map((font) => (
                          <button
                            key={font.id}
                            onClick={() => {
                              setSelectedFont(font.id);
                              setExpandedSection(null);
                            }}
                            className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 text-left ${
                              selectedFont === font.id
                                ? 'border-purple-500 bg-white'
                                : 'border-transparent bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div 
                                  className="text-slate-900 mb-1"
                                  style={{ 
                                    fontFamily: font.heading,
                                    fontSize: '14px'
                                  }}
                                >
                                  {font.heading}
                                </div>
                                <div 
                                  className="text-slate-600 text-xs"
                                  style={{ 
                                    fontFamily: font.body
                                  }}
                                >
                                  {font.body}
                                </div>
                              </div>
                              {selectedFont === font.id && (
                                <Check className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Colors Section */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'colors' ? null : 'colors')}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-sm text-slate-600">Custom Colors</span>
                      {expandedSection === 'colors' ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    
                    {/* Colors Preview - Clickable for Quick Edit */}
                    <div className="px-4 pb-4">
                      <div className="flex gap-2">
                        {getCurrentColors().map((color, index) => (
                          <div key={index} className="relative group">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => handleCustomColorChange(index, e.target.value)}
                              className="w-12 h-12 rounded-lg shadow-sm cursor-pointer opacity-0 absolute inset-0"
                              title={`Color ${index + 1}`}
                            />
                            <div 
                              className="w-12 h-12 rounded-lg shadow-sm cursor-pointer group-hover:ring-2 group-hover:ring-purple-400 transition-all"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Click any color to customize</p>
                    </div>
                    
                    {/* Expanded Colors Content - Detailed Color Pickers */}
                    {expandedSection === 'colors' && (
                      <div className="px-4 pb-4 space-y-3">
                        {getCurrentColors().map((color, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <input
                                  type="color"
                                  value={color}
                                  onChange={(e) => handleCustomColorChange(index, e.target.value)}
                                  className="w-16 h-16 rounded-lg cursor-pointer opacity-0 absolute inset-0"
                                />
                                <div 
                                  className="w-16 h-16 rounded-lg shadow-sm cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all"
                                  style={{ backgroundColor: color }}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-1">Color {index + 1}</div>
                                <input
                                  type="text"
                                  value={color}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                      handleCustomColorChange(index, value);
                                    }
                                  }}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:border-purple-500 focus:outline-none"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Button Style Section */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'buttons' ? null : 'buttons')}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-sm text-slate-600">Button Style</span>
                      {expandedSection === 'buttons' ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    
                    {/* Button Preview (Always Visible) */}
                    <div className="px-4 pb-4">
                      <div 
                        className="px-4 py-2 text-white text-center text-sm"
                        style={{ 
                          backgroundColor: getCurrentColors()[0],
                          borderRadius: buttonStyles.find(s => s.id === selectedButtonStyle)?.borderRadius
                        }}
                      >
                        {buttonStyles.find(s => s.id === selectedButtonStyle)?.name}
                      </div>
                    </div>
                    
                    {/* Expanded Button Styles Content */}
                    {expandedSection === 'buttons' && (
                      <div className="px-4 pb-4 space-y-2">
                        {buttonStyles.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => {
                              setSelectedButtonStyle(style.id);
                              setExpandedSection(null);
                            }}
                            className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                              selectedButtonStyle === style.id
                                ? 'border-purple-500 bg-white'
                                : 'border-transparent bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div 
                                  className="px-4 py-2 text-white text-center text-sm"
                                  style={{ 
                                    backgroundColor: getCurrentColors()[0],
                                    borderRadius: style.borderRadius
                                  }}
                                >
                                  {style.name}
                                </div>
                              </div>
                              {selectedButtonStyle === style.id && (
                                <Check className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input Style Section */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'inputs' ? null : 'inputs')}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-sm text-slate-600">Input Style</span>
                      {expandedSection === 'inputs' ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    
                    {/* Input Preview (Always Visible) */}
                    <div className="px-4 pb-4">
                      <input
                        type="text"
                        placeholder="Sample input field"
                        readOnly
                        className="w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        style={{
                          borderRadius: inputStyles.find(s => s.id === selectedInputStyle)?.borderRadius,
                          border: inputStyles.find(s => s.id === selectedInputStyle)?.border,
                          borderBottom: inputStyles.find(s => s.id === selectedInputStyle)?.borderBottom
                        }}
                      />
                    </div>
                    
                    {/* Expanded Input Styles Content */}
                    {expandedSection === 'inputs' && (
                      <div className="px-4 pb-4 space-y-2">
                        {inputStyles.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => {
                              setSelectedInputStyle(style.id);
                              setExpandedSection(null);
                            }}
                            className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                              selectedInputStyle === style.id
                                ? 'border-purple-500 bg-white'
                                : 'border-transparent bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  placeholder={style.name}
                                  readOnly
                                  className="w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 pointer-events-none"
                                  style={{
                                    borderRadius: style.borderRadius,
                                    border: style.border,
                                    borderBottom: style.borderBottom
                                  }}
                                />
                              </div>
                              {selectedInputStyle === style.id && (
                                <Check className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <img 
                  src={step === 3 ? nebulaStep3Img : nebulaImg} 
                  alt="Cosmic nebula" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}