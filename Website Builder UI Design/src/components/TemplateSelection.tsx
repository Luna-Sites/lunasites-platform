import { useState } from 'react';
import { Search, FileText, Store, Camera, Utensils, Calendar, Briefcase, Palette, Heart, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import portfolioImg from 'figma:asset/cadb01d5f39257b9bed043b110f35314dd1c3305.png';
import restaurantImg from 'figma:asset/b23bd12188c3ef947fd6b1b0bbe43fd80fbfc342.png';
import shopImg from 'figma:asset/71307606acb6787b5e76de625a8ec65231dd9256.png';
import blogImg from 'figma:asset/041cf6f3cefd4852af7111701a69ab2fdd52620e.png';
import eventImg from 'figma:asset/76d3c409747ba05034bcb396ba101e021e656b6e.png';
import img6 from 'figma:asset/f2b6ee8458f1f24edd1158a6df9bdc487e1e99a2.png';

interface TemplateSelectionProps {
  onSelectTemplate: (templateId: string | null) => void;
  onBack: () => void;
}

export default function TemplateSelection({ onSelectTemplate, onBack }: TemplateSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'popular' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Panel - Selection Interface */}
        <div className="flex flex-col p-8 lg:p-16 overflow-y-auto">
          <div className="mb-12">
            <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 mb-8 flex items-center gap-2">
              ← Back to Home
            </button>
            <div className="mb-2 text-xs text-slate-500 tracking-wide">STEP 1 OF 6</div>
            <h1 className="text-4xl mb-3 text-slate-900">Choose your starting point</h1>
            <p className="text-slate-600">
              Select a template to customize or start with a blank canvas
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for your site type"
              className="pl-12 py-6 bg-white border-slate-200 rounded-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Categories */}
          <div className="mb-8">
            <div className="text-sm mb-4 text-slate-700">Popular Topics</div>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-300">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="size-4" />
                      <span>{category.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blank Website Option */}
          <button
            onClick={() => onSelectTemplate(null)}
            className="w-full p-6 mb-6 rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
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

        {/* Right Panel - Template Preview */}
        <div className="relative bg-gradient-to-br from-amber-100/30 via-rose-100/30 to-purple-100/30 p-8 lg:p-16 hidden lg:flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1732565277341-ebb37d748a87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGJlaWdlJTIwcGF0dGVybnxlbnwxfHx8fDE3NjUyODcwNzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')] bg-cover bg-center opacity-40" />
          
          {/* Template Grid */}
          <div className="relative z-10 grid grid-cols-2 gap-6 max-w-2xl">
            {filteredTemplates.slice(0, 4).map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <div className="text-white text-left">
                    <div className="mb-1">{template.name}</div>
                    <div className="text-sm text-white/80">{template.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* View All Templates */}
          {filteredTemplates.length > 4 && (
            <div className="absolute bottom-8 right-8">
              <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg text-sm text-purple-600">
                +{filteredTemplates.length - 4} more templates
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Template List */}
      <div className="lg:hidden px-8 pb-8">
        <h2 className="text-xl mb-6 text-slate-900">Available Templates</h2>
        <div className="grid grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={template.image}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <div className="text-sm mb-1 text-slate-900">{template.name}</div>
                <div className="text-xs text-slate-600">{template.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}