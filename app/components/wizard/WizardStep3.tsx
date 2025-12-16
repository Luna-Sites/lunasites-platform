import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface WizardStep3Props {
  siteTitle: string;
  siteId: string;
  siteIdError: string | null;
  checkingAvailability: boolean;
  totalSteps: number;
  onSiteTitleChange: (title: string) => void;
  onSiteIdChange: (id: string) => void;
  onSiteIdBlur: () => void;
}

export default function WizardStep3({
  siteTitle,
  siteId,
  siteIdError,
  checkingAvailability,
  totalSteps,
  onSiteTitleChange,
  onSiteIdChange,
  onSiteIdBlur
}: WizardStep3Props) {
  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="mb-12 text-center">
        <div className="mb-2 text-xs text-slate-500 tracking-wide">STEP 3 OF {totalSteps}</div>
        <h2 className="text-4xl mb-4 text-slate-900 font-bold">Name your website</h2>
        <p className="text-slate-600 text-lg">Choose a title and URL for your site</p>
      </div>

      <div className="space-y-8">
        <div>
          <Label htmlFor="site-title" className="text-base font-semibold text-slate-900 mb-3 block">Site Title</Label>
          <Input
            id="site-title"
            placeholder="My Awesome Website"
            value={siteTitle}
            onChange={(e) => onSiteTitleChange(e.target.value)}
            className="h-14 px-4 text-base bg-slate-50 border-slate-200 rounded-lg"
          />
        </div>

        <div>
          <Label htmlFor="site-id" className="text-base font-semibold text-slate-900 mb-3 block">Site ID (URL)</Label>
          <Input
            id="site-id"
            placeholder="my-awesome-site"
            value={siteId}
            onChange={(e) => onSiteIdChange(e.target.value)}
            onBlur={onSiteIdBlur}
            className="h-14 px-4 text-base bg-slate-50 border-slate-200 rounded-lg"
          />
          {checkingAvailability && (
            <p className="text-blue-500 text-sm mt-2">Checking availability...</p>
          )}
          {siteIdError && (
            <p className="text-red-500 text-sm mt-2">{siteIdError}</p>
          )}
          {!siteIdError && siteId && !checkingAvailability && (
            <p className="text-green-500 text-sm mt-2">Available!</p>
          )}
          <p className="text-sm text-slate-500 mt-3">
            Your site will be available at: <span className="text-purple-600 font-medium">{siteId || 'your-site'}.lunaweb.app</span>
          </p>
        </div>
      </div>
    </div>
  );
}
