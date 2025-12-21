import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface FontSettings {
  headingId: string;
  bodyId: string;
  headingWeight: number;
  bodyWeight: number;
  baseFontSize: number;
  baseFontSizeMobile: number;
}

interface TemplateIframePreviewProps {
  siteId: string;
  mode: 'card' | 'full';
  className?: string;
  colors?: string[]; // [primary, secondary, accent, background]
  fonts?: FontSettings;
}

export default function TemplateIframePreview({
  siteId,
  mode,
  className = '',
  colors,
  fonts
}: TemplateIframePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const scrollPosRef = useRef(0);

  // Build URL with color and font query params for preview
  const buildSiteUrl = (currentColors?: string[], currentFonts?: FontSettings) => {
    const baseUrl = `https://${siteId}.luna-sites.com`;
    const params = new URLSearchParams();

    // Add color params
    if (currentColors && currentColors.length > 0) {
      if (currentColors[0]) params.set('primary', currentColors[0]);
      if (currentColors[1]) params.set('secondary', currentColors[1]);
      if (currentColors[2]) params.set('accent', currentColors[2]);
      if (currentColors[3]) params.set('background', currentColors[3]);
    }

    // Add font params
    if (currentFonts) {
      params.set('font_heading', currentFonts.headingId);
      params.set('font_body', currentFonts.bodyId);
      params.set('heading_weight', String(currentFonts.headingWeight));
      params.set('body_weight', String(currentFonts.bodyWeight));
      params.set('base_size', String(currentFonts.baseFontSize));
      params.set('base_size_mobile', String(currentFonts.baseFontSizeMobile));
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const siteUrl = buildSiteUrl(colors, fonts);

  useEffect(() => {
    // Reset state when siteId, colors, or fonts change
    setLoading(true);
    setError(false);
  }, [siteId, colors, fonts]);

  // Hover-based scroll animation for card mode
  useEffect(() => {
    if (mode !== 'card' || loading) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    const scrollSpeed = 2; // pixels per frame

    const animate = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const maxScroll = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;

        if (isHovering) {
          // Scroll down on hover
          scrollPosRef.current = Math.min(scrollPosRef.current + scrollSpeed, maxScroll);
        } else {
          // Scroll back to top when not hovering
          scrollPosRef.current = Math.max(scrollPosRef.current - scrollSpeed * 2, 0);
        }

        doc.documentElement.scrollTop = scrollPosRef.current;

        // Continue animation if still scrolling
        if ((isHovering && scrollPosRef.current < maxScroll) ||
            (!isHovering && scrollPosRef.current > 0)) {
          animationRef.current = requestAnimationFrame(animate);
        }
      } catch {
        // Cross-origin restriction - can't control scroll
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mode, loading, isHovering]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const handleMouseEnter = () => {
    if (mode === 'card') {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (mode === 'card') {
      setIsHovering(false);
    }
  };

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-slate-500">
          <p className="text-sm">Preview unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-slate-100 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 z-10">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}

      <iframe
        key={siteUrl}
        ref={iframeRef}
        src={siteUrl}
        title="Template preview"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full border-0 ${mode === 'card' ? 'pointer-events-none' : ''}`}
        style={{
          // Scale down for card view to show more content
          ...(mode === 'card' && {
            transform: 'scale(0.5)',
            transformOrigin: 'top left',
            width: '200%',
            height: '200%',
          }),
        }}
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Overlay gradient for card mode */}
      {mode === 'card' && !loading && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/20 via-transparent to-transparent" />
      )}
    </div>
  );
}
