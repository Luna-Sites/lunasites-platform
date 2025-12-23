import { useState } from "react";
import { Globe } from "lucide-react";
import type { PublicTemplate } from "../../lib/api";

interface TemplateCardProps {
  template: PublicTemplate;
  onSelect: (templateId: string, sourceSiteId?: string) => void;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const thumbnailUrl = template.thumbnailUrl || null;
  const siteUrl = `https://${template.sourceSiteId}.luna-sites.com`;

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIframeLoaded(false);
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  return (
    <button
      onClick={() => onSelect(template.id, template.sourceSiteId)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]"
    >
      <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 relative">
        {/* Screenshot (default view) */}
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={template.name}
            className={`w-full h-full object-cover object-top transition-opacity duration-300 absolute inset-0 ${
              isHovered && iframeLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
          />
        )}

        {/* Fallback when no thumbnail */}
        {!thumbnailUrl && !isHovered && (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="w-16 h-16 text-purple-300" />
          </div>
        )}

        {/* Iframe with CSS scroll animation */}
        {isHovered && (
          <div
            className={`absolute inset-0 overflow-hidden transition-opacity duration-300 ${
              iframeLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/*
              The trick: we make the iframe much taller than the viewport,
              then animate its Y position using CSS to create a scroll effect.
              The container clips it with overflow:hidden.
            */}
            <div
              className={`w-full ${iframeLoaded ? 'animate-scroll-preview' : ''}`}
              style={{
                height: '400%', // iframe is 4x taller than container
              }}
            >
              <iframe
                src={siteUrl}
                title={template.name}
                onLoad={handleIframeLoad}
                className="w-[200%] h-full origin-top-left pointer-events-none border-0"
                style={{ transform: 'scale(0.5)' }}
                loading="eager"
              />
            </div>
          </div>
        )}

        {/* Loading indicator while iframe loads */}
        {isHovered && !iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="p-6 text-left">
        <div className="text-slate-900 font-medium mb-1">{template.name}</div>
        <div className="text-sm text-slate-600">
          {template.description || "No description"}
        </div>
      </div>

      {/* CSS Animation for scroll effect - moves 1000px down then back */}
      <style>{`
        @keyframes scroll-preview {
          0% {
            transform: translateY(0);
          }
          45% {
            transform: translateY(-300px);
          }
          55% {
            transform: translateY(-300px);
          }
          100% {
            transform: translateY(0);
          }
        }
        .animate-scroll-preview {
          animation: scroll-preview 8s ease-in-out infinite;
        }
      `}</style>
    </button>
  );
}
