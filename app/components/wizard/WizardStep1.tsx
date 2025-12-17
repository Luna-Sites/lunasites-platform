import { ArrowRight } from 'lucide-react';
import { categories, templates } from '../../data/wizard-data';

interface WizardStep1Props {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onTemplateSelect: (templateId: string) => void;
  totalSteps: number;
}

export default function WizardStep1({
  selectedCategory,
  onCategoryChange,
  onTemplateSelect,
  totalSteps
}: WizardStep1Props) {
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = !selectedCategory || selectedCategory === 'popular' || template.category === selectedCategory;
    return matchesCategory;
  });

  return (
    <div className="min-h-screen p-8 lg:p-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700 mb-8 flex items-center gap-2 mx-auto w-fit">
            ← Back to Home
          </a>
          <div className="mb-2 text-xs text-slate-500 tracking-wide">STEP 1 OF {totalSteps}</div>
          <h1 className="text-4xl mb-3 text-slate-900 font-bold">Choose your starting point</h1>
          <p className="text-slate-600 mb-8">
            Select a template to customize or start with a blank canvas
          </p>

          {/* Category Select and Blank Canvas - Same Row */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch mb-12">
            {/* Category Select - Left */}
            <div className="flex-1">
              <select
                value={selectedCategory || 'popular'}
                onChange={(e) => onCategoryChange(e.target.value === 'popular' ? null : e.target.value)}
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
              onClick={() => onTemplateSelect('blank')}
              className="flex-1 p-6 rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-slate-900 font-medium mb-1">Start with Blank Canvas</div>
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
              onClick={() => onTemplateSelect(template.id)}
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
                <div className="text-slate-900 font-medium mb-1">{template.name}</div>
                <div className="text-sm text-slate-600">{template.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
