import { ASSETS } from '../../data/wizard-data';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <a href="/" className="flex items-center gap-2">
          <img src={ASSETS.logo} alt="Luna Sites" className="w-[175px]" />
        </a>
        <span className="text-sm text-slate-500">Step {currentStep} of {totalSteps}</span>
      </div>

      <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#F5B400] to-[#D920B7] transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}
