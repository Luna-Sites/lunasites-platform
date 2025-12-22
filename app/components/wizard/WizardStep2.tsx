import TemplatePreview from "./TemplatePreview";
import StylePanel from "./StylePanel";
import { ASSETS } from "../../data/wizard-data";

interface WizardStep2Props {
  selectedTemplate: string | null;
  selectedTemplateSiteId: string | null;
  selectedPalette: string | null;
  selectedFont: string | null;
  selectedButtonStyle: string;
  selectedInputStyle: string;
  expandedSection: string | null;
  currentColors: string[];
  baseFontSize: number;
  baseFontSizeMobile: number;
  totalSteps: number;
  onPaletteChange: (paletteId: string) => void;
  onFontChange: (fontId: string) => void;
  onButtonStyleChange: (styleId: string) => void;
  onInputStyleChange: (styleId: string) => void;
  onExpandSection: (section: string | null) => void;
  onCustomColorChange: (index: number, color: string) => void;
  onBaseFontSizeChange: (size: number) => void;
  onBaseFontSizeMobileChange: (size: number) => void;
}

export default function WizardStep2({
  selectedTemplate,
  selectedTemplateSiteId,
  selectedPalette,
  selectedFont,
  selectedButtonStyle,
  selectedInputStyle,
  expandedSection,
  currentColors,
  baseFontSize,
  baseFontSizeMobile,
  totalSteps,
  onPaletteChange,
  onFontChange,
  onButtonStyleChange,
  onInputStyleChange,
  onExpandSection,
  onCustomColorChange,
  onBaseFontSizeChange,
  onBaseFontSizeMobileChange,
}: WizardStep2Props) {
  return (
    <>
      {/* Left Panel - Preview */}
      <div className="animate-in fade-in duration-500">
        {/* Template Preview with Selected Colors & Fonts */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200">
          <TemplatePreview
            selectedTemplate={selectedTemplate}
            sourceSiteId={selectedTemplateSiteId}
            selectedFont={selectedFont}
            selectedButtonStyle={selectedButtonStyle}
            colors={currentColors}
            baseFontSize={baseFontSize}
            baseFontSizeMobile={baseFontSizeMobile}
          />
        </div>
      </div>

      {/* Right Panel - Style Controls (rendered in parent's grid layout) */}
    </>
  );
}

// Separate export for the right panel
export function WizardStep2RightPanel(
  props: Omit<WizardStep2Props, "totalSteps">
) {
  return (
    <div className="p-8 lg:p-16 lg:pt-0">
      <StylePanel
        selectedPalette={props.selectedPalette}
        selectedFont={props.selectedFont}
        selectedButtonStyle={props.selectedButtonStyle}
        selectedInputStyle={props.selectedInputStyle}
        expandedSection={props.expandedSection}
        currentColors={props.currentColors}
        baseFontSize={props.baseFontSize}
        baseFontSizeMobile={props.baseFontSizeMobile}
        onPaletteChange={props.onPaletteChange}
        onFontChange={props.onFontChange}
        onButtonStyleChange={props.onButtonStyleChange}
        onInputStyleChange={props.onInputStyleChange}
        onExpandSection={props.onExpandSection}
        onCustomColorChange={props.onCustomColorChange}
        onBaseFontSizeChange={props.onBaseFontSizeChange}
        onBaseFontSizeMobileChange={props.onBaseFontSizeMobileChange}
      />
    </div>
  );
}
