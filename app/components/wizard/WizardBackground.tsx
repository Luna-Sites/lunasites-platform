import { ASSETS } from '../../data/wizard-data';

interface WizardBackgroundProps {
  step: number;
}

export default function WizardBackground({ step }: WizardBackgroundProps) {
  return (
    <div className="relative w-full h-full">
      <img
        src={step === 3 ? ASSETS.nebulaStep3Img : ASSETS.nebulaImg}
        alt="Cosmic nebula"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
