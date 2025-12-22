import { useState, useEffect } from "react";
import { ArrowRight, Globe } from "lucide-react";
import { getPublicTemplates, type PublicTemplate } from "../../lib/api";
import WizardProgress from "./WizardProgress";

interface WizardStep1Props {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onTemplateSelect: (templateId: string, sourceSiteId?: string) => void;
  totalSteps: number;
}

export default function WizardStep1({
  onTemplateSelect,
  totalSteps,
}: WizardStep1Props) {
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getPublicTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate screenshot URL from site ID if no thumbnail exists
  const getTemplateImage = (template: PublicTemplate): string | null => {
    if (template.thumbnailUrl) {
      return template.thumbnailUrl;
    }

    // Use screenshot API as fallback
    if (template.sourceSiteId) {
      const siteUrl = `https://${template.sourceSiteId}.luna-sites.com`;
      const apiKey = import.meta.env.VITE_SCREENSHOTONE_API_KEY;

      if (!apiKey) {
        console.warn('VITE_SCREENSHOTONE_API_KEY not set. Template screenshots will not load.');
        return null;
      }

      // Using ScreenshotOne API
      return `https://api.screenshotone.com/take?access_key=${apiKey}&url=${encodeURIComponent(siteUrl)}&viewport_width=1200&viewport_height=800&device_scale_factor=1&format=jpg&image_quality=80&block_ads=true&block_cookie_banners=true&block_trackers=true&cache=true&cache_ttl=2592000`;
    }

    return null;
  };

  return (
    <div className="min-h-screen p-8 lg:p-16">
      <div className="max-w-7xl mx-auto">
        <WizardProgress
          currentStep={1}
          totalSteps={totalSteps}
          stepTitle="Choose your starting point"
        />
        <div className="mb-12 text-center">
          <p className="text-slate-600 mb-8 mt-8">
            Select a template to customize or start with a blank canvas
          </p>

          {/* Blank Canvas Button */}
          <div className="flex justify-center mb-12">
            <button
              onClick={() => onTemplateSelect("blank")}
              className="w-full max-w-md p-6 rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-slate-900 font-medium mb-1">
                    Start with Blank Canvas
                  </div>
                  <div className="text-sm text-slate-600">
                    Build your website from scratch
                  </div>
                </div>
                <ArrowRight className="size-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading templates...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && templates.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Globe className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">
              No templates available yet
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Start with a blank canvas or check back later
            </p>
          </div>
        )}

        {/* Templates Grid - 2 Columns */}
        {!loading && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() =>
                  onTemplateSelect(template.id, template.sourceSiteId)
                }
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]"
              >
                <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
                  {getTemplateImage(template) ? (
                    <img
                      src={getTemplateImage(template)!}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Globe className="w-16 h-16 text-purple-300" />
                    </div>
                  )}
                </div>
                <div className="p-6 text-left">
                  <div className="text-slate-900 font-medium mb-1">
                    {template.name}
                  </div>
                  <div className="text-sm text-slate-600">
                    {template.description || "No description"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
