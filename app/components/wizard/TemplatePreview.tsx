import { fontPairs, buttonStyles } from '../../data/wizard-data';
import TemplateIframePreview from './TemplateIframePreview';

interface TemplatePreviewProps {
  selectedTemplate: string | null;
  sourceSiteId: string | null;
  selectedFont: string;
  selectedButtonStyle: string;
  colors: string[];
}

export default function TemplatePreview({
  selectedTemplate,
  sourceSiteId,
  selectedFont,
  selectedButtonStyle,
  colors
}: TemplatePreviewProps) {
  const currentFont = fontPairs.find(f => f.id === selectedFont);
  const currentButtonStyle = buttonStyles.find(s => s.id === selectedButtonStyle);

  // Blank canvas - show placeholder preview with selected styles
  if (selectedTemplate === 'blank') {
    return (
      <div className="aspect-[16/10] bg-white flex flex-col items-center justify-center p-12">
        <div className="text-center space-y-6 max-w-xl">
          <div
            style={{
              color: colors[0],
              fontFamily: currentFont?.heading,
              fontSize: '48px',
              lineHeight: '1.2',
              marginBottom: '16px'
            }}
          >
            Your Website Title
          </div>
          <p
            style={{
              color: colors[1],
              fontFamily: currentFont?.body,
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
                backgroundColor: colors[0],
                fontFamily: currentFont?.body,
                borderRadius: currentButtonStyle?.borderRadius
              }}
            >
              Primary Button
            </div>
            <div
              className="px-6 py-3 rounded-lg text-white"
              style={{
                backgroundColor: colors[1],
                fontFamily: currentFont?.body,
                borderRadius: currentButtonStyle?.borderRadius
              }}
            >
              Secondary Button
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Template selected - show interactive iframe preview
  if (sourceSiteId) {
    return (
      <TemplateIframePreview
        siteId={sourceSiteId}
        mode="full"
        className="aspect-[16/10]"
      />
    );
  }

  // Fallback if no sourceSiteId
  return (
    <div className="aspect-[16/10] bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
      <p className="text-slate-500">Preview not available</p>
    </div>
  );
}
