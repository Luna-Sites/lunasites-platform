import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface TemplateIframePreviewProps {
  siteId: string;
  mode: 'card' | 'full';
  className?: string;
}

export default function TemplateIframePreview({
  siteId,
  mode,
  className = ''
}: TemplateIframePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const siteUrl = `https://${siteId}.luna-sites.com`;

  useEffect(() => {
    // Reset state when siteId changes
    setLoading(true);
    setError(false);
  }, [siteId]);

  useEffect(() => {
    if (mode !== 'card' || loading) return;

    // Auto-scroll animation for card mode
    const startScrollAnimation = () => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      let scrollPos = 0;
      let direction = 1;
      const scrollSpeed = 0.5;
      const pauseAtEnds = 2000; // 2 seconds pause at top/bottom
      let pauseStart: number | null = null;

      const animate = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!doc) {
            animationRef.current = requestAnimationFrame(animate);
            return;
          }

          const maxScroll = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;

          // Handle pause at ends
          if (pauseStart !== null) {
            if (Date.now() - pauseStart < pauseAtEnds) {
              animationRef.current = requestAnimationFrame(animate);
              return;
            }
            pauseStart = null;
          }

          // Update scroll position
          scrollPos += scrollSpeed * direction;

          // Check bounds and pause
          if (scrollPos >= maxScroll) {
            scrollPos = maxScroll;
            direction = -1;
            pauseStart = Date.now();
          } else if (scrollPos <= 0) {
            scrollPos = 0;
            direction = 1;
            pauseStart = Date.now();
          }

          doc.documentElement.scrollTop = scrollPos;
        } catch {
          // Cross-origin restriction - can't control scroll
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      // Start animation after a short delay
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, 1000);
    };

    startScrollAnimation();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mode, loading]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
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
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 z-10">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}

      <iframe
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
