import { templates, fontPairs, buttonStyles } from '../../data/wizard-data';

interface TemplatePreviewProps {
  selectedTemplate: string | null;
  selectedFont: string;
  selectedButtonStyle: string;
  colors: string[];
}

export default function TemplatePreview({
  selectedTemplate,
  selectedFont,
  selectedButtonStyle,
  colors
}: TemplatePreviewProps) {
  const currentFont = fontPairs.find(f => f.id === selectedFont);
  const currentButtonStyle = buttonStyles.find(s => s.id === selectedButtonStyle);

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

  const template = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="relative">
      <img
        src={template?.image}
        alt="Template preview"
        className="w-full aspect-[16/10] object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"
        style={{
          background: `linear-gradient(135deg, ${colors[0]}15 0%, ${colors[1]}25 100%)`
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
        <div
          className="text-white mb-4"
          style={{
            fontFamily: currentFont?.heading,
            fontSize: '32px',
            lineHeight: '1.2'
          }}
        >
          {template?.name}
        </div>
        <div className="flex gap-3">
          {colors.map((color, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded-lg shadow-lg"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
