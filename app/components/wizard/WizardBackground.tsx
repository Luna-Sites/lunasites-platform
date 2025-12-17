import { ASSETS } from '../../data/wizard-data';

interface WizardBackgroundProps {
  step: number;
}

export default function WizardBackground({ step }: WizardBackgroundProps) {
  const getBackgroundImage = () => {
    if (step === 3) return ASSETS.nebulaStep3Img;
    if (step === 4) return ASSETS.nebulaStep4Img;
    return ASSETS.nebulaImg;
  };

  return (
    <div className="relative w-full h-full">
      <img
        src={getBackgroundImage()}
        alt="Cosmic nebula"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
