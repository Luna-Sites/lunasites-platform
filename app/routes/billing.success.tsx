import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function meta() {
  return [
    { title: 'Payment Successful - Luna Sites' },
    { name: 'description', content: 'Your payment was successful' },
  ];
}

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function redirectToSettings() {
      if (!sessionId) {
        // No session ID, just go to sites
        navigate('/sites');
        return;
      }

      try {
        // Get siteId from session
        const response = await fetch(`${API_BASE_URL}/billing/session/${sessionId}`);

        if (!response.ok) {
          throw new Error('Failed to get session details');
        }

        const data = await response.json();

        if (data.siteId) {
          // Redirect to site settings with success message
          navigate(`/sites/${data.siteId}/settings?payment=success`);
        } else {
          // No siteId in session, go to sites list
          navigate('/sites?payment=success');
        }
      } catch (err) {
        console.error('Error getting session:', err);
        setError('Could not verify payment. Redirecting...');
        // Fallback to sites list after delay
        setTimeout(() => navigate('/sites?payment=success'), 2000);
      }
    }

    redirectToSettings();
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-slate-600 mb-4">
          {error || 'Redirecting to your site settings...'}
        </p>
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
