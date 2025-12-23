import { useState } from "react";
import { Globe } from "lucide-react";
import type { PublicTemplate } from "../../lib/api";

interface TemplateCardProps {
  template: PublicTemplate;
  onSelect: (templateId: string, sourceSiteId?: string) => void;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const thumbnailUrl = template.thumbnailUrl || null;

  return (
    <button
      onClick={() => onSelect(template.id, template.sourceSiteId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]"
    >
      <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 relative">
        {/* Screenshot with scroll animation on hover */}
        {thumbnailUrl ? (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={thumbnailUrl}
              alt={template.name}
              className={`w-full object-cover object-top transition-transform duration-[4000ms] ease-in-out ${
                isHovered ? 'translate-y-[-300px]' : 'translate-y-0'
              }`}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="w-16 h-16 text-purple-300" />
          </div>
        )}
      </div>

      <div className="p-6 text-left">
        <div className="text-slate-900 font-medium mb-1">{template.name}</div>
        <div className="text-sm text-slate-600">
          {template.description || "No description"}
        </div>
      </div>
    </button>
  );
}
