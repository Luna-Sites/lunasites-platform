import { Check, ChevronRight, ChevronDown } from 'lucide-react';
import { colorPalettes, fontPairs, buttonStyles, inputStyles } from '../../data/wizard-data';

interface StylePanelProps {
  selectedPalette: string | null;
  selectedFont: string;
  selectedButtonStyle: string;
  selectedInputStyle: string;
  expandedSection: string | null;
  currentColors: string[];
  baseFontSize: number;
  baseFontSizeMobile: number;
  onPaletteChange: (paletteId: string) => void;
  onFontChange: (fontId: string) => void;
  onButtonStyleChange: (styleId: string) => void;
  onInputStyleChange: (styleId: string) => void;
  onExpandSection: (section: string | null) => void;
  onCustomColorChange: (index: number, color: string) => void;
  onBaseFontSizeChange: (size: number) => void;
  onBaseFontSizeMobileChange: (size: number) => void;
}

export default function StylePanel({
  selectedPalette,
  selectedFont,
  selectedButtonStyle,
  selectedInputStyle,
  expandedSection,
  currentColors,
  baseFontSize,
  baseFontSizeMobile,
  onPaletteChange,
  onFontChange,
  onButtonStyleChange,
  onInputStyleChange,
  onExpandSection,
  onCustomColorChange,
  onBaseFontSizeChange,
  onBaseFontSizeMobileChange
}: StylePanelProps) {
  const currentFontPair = fontPairs.find(f => f.id === selectedFont);
  const currentPalette = colorPalettes.find(p => p.id === selectedPalette);
  const currentButtonStyle = buttonStyles.find(s => s.id === selectedButtonStyle);
  const currentInputStyle = inputStyles.find(s => s.id === selectedInputStyle);

  return (
    <div className="flex flex-col w-full">
      <h2 className="text-2xl text-slate-900 mb-6 font-bold">Site Styles</h2>

      <div className="space-y-4">
        {/* Themes Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <button
            onClick={() => onExpandSection(expandedSection === 'themes' ? null : 'themes')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">Themes</span>
            {expandedSection === 'themes' ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Themes Preview (Always Visible) */}
          <div className="px-4 pb-4">
            <div className="bg-slate-200 rounded-lg p-4 flex items-center gap-3">
              <div
                className="text-3xl font-bold"
                style={{ fontFamily: currentFontPair?.heading }}
              >
                Aa
              </div>
              <div className="flex gap-2">
                {currentPalette?.colors.slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div
                className="ml-auto px-4 py-1.5 rounded-full text-white text-xs font-medium"
                style={{ backgroundColor: currentPalette?.colors[0] }}
              >
                BUTTON
              </div>
            </div>
          </div>

          {/* Expanded Themes Content */}
          {expandedSection === 'themes' && (
            <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
              {colorPalettes.map((palette) => (
                <button
                  key={palette.id}
                  onClick={() => {
                    onPaletteChange(palette.id);
                    onExpandSection(null);
                  }}
                  className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                    selectedPalette === palette.id
                      ? 'border-purple-500 bg-white'
                      : 'border-transparent bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {palette.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 flex-1 text-left font-medium">{palette.name}</p>
                    {selectedPalette === palette.id && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fonts Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <button
            onClick={() => onExpandSection(expandedSection === 'fonts' ? null : 'fonts')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">Fonts</span>
            {expandedSection === 'fonts' ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Fonts Preview (Always Visible) */}
          <div className="px-4 pb-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div
                className="text-slate-900 mb-1"
                style={{
                  fontFamily: currentFontPair?.heading,
                  fontWeight: currentFontPair?.headingWeight,
                  fontSize: `${baseFontSize * 1.5}px`
                }}
              >
                Heading
              </div>
              <p
                className="text-slate-600"
                style={{
                  fontFamily: currentFontPair?.body,
                  fontWeight: currentFontPair?.bodyWeight,
                  fontSize: `${baseFontSize}px`
                }}
              >
                This is your paragraph.
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                {currentFontPair?.heading} · {currentFontPair?.body}
              </div>
            </div>
          </div>

          {/* Expanded Fonts Content */}
          {expandedSection === 'fonts' && (
            <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
              {fontPairs.map((font) => (
                <button
                  key={font.id}
                  onClick={() => {
                    onFontChange(font.id);
                    onExpandSection(null);
                  }}
                  className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 text-left ${
                    selectedFont === font.id
                      ? 'border-purple-500 bg-white'
                      : 'border-transparent bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div
                        className="text-slate-900 mb-0.5"
                        style={{
                          fontFamily: font.heading,
                          fontWeight: font.headingWeight,
                          fontSize: '18px'
                        }}
                      >
                        Heading
                      </div>
                      <div
                        className="text-slate-600 text-sm"
                        style={{
                          fontFamily: font.body,
                          fontWeight: font.bodyWeight
                        }}
                      >
                        This is your paragraph.
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {font.name}
                      </div>
                    </div>
                    {selectedFont === font.id && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Base Font Size Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <div className="px-4 py-3">
            <span className="text-sm font-medium text-slate-700">Base Size</span>
          </div>
          <div className="px-4 pb-4 space-y-3">
            {/* Desktop Size */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Desktop</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onBaseFontSizeChange(Math.max(12, baseFontSize - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 font-medium"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-medium text-slate-900">
                  {baseFontSize}px
                </span>
                <button
                  onClick={() => onBaseFontSizeChange(Math.min(24, baseFontSize + 1))}
                  className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 font-medium"
                >
                  +
                </button>
              </div>
            </div>
            {/* Mobile Size */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Mobile</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onBaseFontSizeMobileChange(Math.max(12, baseFontSizeMobile - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 font-medium"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-medium text-slate-900">
                  {baseFontSizeMobile}px
                </span>
                <button
                  onClick={() => onBaseFontSizeMobileChange(Math.min(24, baseFontSizeMobile + 1))}
                  className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 font-medium"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Colors Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <button
            onClick={() => onExpandSection(expandedSection === 'colors' ? null : 'colors')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">Custom Colors</span>
            {expandedSection === 'colors' ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Colors Preview - Clickable for Quick Edit */}
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              {currentColors.map((color, index) => (
                <div key={index} className="relative group">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => onCustomColorChange(index, e.target.value)}
                    className="w-12 h-12 rounded-lg shadow-sm cursor-pointer opacity-0 absolute inset-0"
                    title={`Color ${index + 1}`}
                  />
                  <div
                    className="w-12 h-12 rounded-lg shadow-sm cursor-pointer group-hover:ring-2 group-hover:ring-purple-400 transition-all"
                    style={{ backgroundColor: color }}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Click any color to customize</p>
          </div>
        </div>

        {/* Button Style Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <button
            onClick={() => onExpandSection(expandedSection === 'buttons' ? null : 'buttons')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">Button Style</span>
            {expandedSection === 'buttons' ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Button Preview (Always Visible) */}
          <div className="px-4 pb-4">
            <div
              className="px-4 py-2 text-white text-center text-sm font-medium"
              style={{
                backgroundColor: currentColors[0],
                borderRadius: currentButtonStyle?.borderRadius
              }}
            >
              {currentButtonStyle?.name}
            </div>
          </div>

          {/* Expanded Button Styles Content */}
          {expandedSection === 'buttons' && (
            <div className="px-4 pb-4 space-y-2">
              {buttonStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    onButtonStyleChange(style.id);
                    onExpandSection(null);
                  }}
                  className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                    selectedButtonStyle === style.id
                      ? 'border-purple-500 bg-white'
                      : 'border-transparent bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div
                        className="px-4 py-2 text-white text-center text-sm font-medium"
                        style={{
                          backgroundColor: currentColors[0],
                          borderRadius: style.borderRadius
                        }}
                      >
                        {style.name}
                      </div>
                    </div>
                    {selectedButtonStyle === style.id && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Style Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <button
            onClick={() => onExpandSection(expandedSection === 'inputs' ? null : 'inputs')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">Input Style</span>
            {expandedSection === 'inputs' ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Input Preview (Always Visible) */}
          <div className="px-4 pb-4">
            <input
              type="text"
              placeholder="Sample input field"
              readOnly
              className="w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none"
              style={{
                borderRadius: currentInputStyle?.borderRadius,
                border: currentInputStyle?.border,
                borderBottom: currentInputStyle?.borderBottom
              }}
            />
          </div>

          {/* Expanded Input Styles Content */}
          {expandedSection === 'inputs' && (
            <div className="px-4 pb-4 space-y-2">
              {inputStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    onInputStyleChange(style.id);
                    onExpandSection(null);
                  }}
                  className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                    selectedInputStyle === style.id
                      ? 'border-purple-500 bg-white'
                      : 'border-transparent bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder={style.name}
                        readOnly
                        className="w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 pointer-events-none"
                        style={{
                          borderRadius: style.borderRadius,
                          border: style.border,
                          borderBottom: style.borderBottom
                        }}
                      />
                    </div>
                    {selectedInputStyle === style.id && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
