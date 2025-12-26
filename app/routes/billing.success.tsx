import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function meta() {
  return [
    { title: 'Payment - Luna Sites' },
    { name: 'description', content: 'Processing your payment' },
  ];
}

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const [message, setMessage] = useState('Processing payment...');

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function redirectToSettings() {
      if (!sessionId) {
        // No session ID, just go to sites
        navigate('/sites');
        return;
      }

      try {
        // Get siteId and payment status from session
        const response = await fetch(`${API_BASE_URL}/billing/session/${sessionId}`);

        if (!response.ok) {
          throw new Error('Failed to get session details');
        }

        const data = await response.json();
        const redirectUrl = data.siteId
          ? `/sites/${data.siteId}/settings`
          : '/sites';

        // Check payment status
        if (data.paymentStatus === 'paid') {
          setStatus('success');
          setMessage('Payment successful! Redirecting...');
          setTimeout(() => navigate(`${redirectUrl}?payment=success`), 1500);
        } else if (data.paymentStatus === 'unpaid' || data.status === 'expired') {
          setStatus('failed');
          setMessage('Payment was not completed.');
          setTimeout(() => navigate(`${redirectUrl}?payment=failed`), 2000);
        } else {
          // Payment pending or other status
          setStatus('loading');
          setMessage('Verifying payment...');
          setTimeout(() => navigate(`${redirectUrl}?payment=pending`), 2000);
        }
      } catch (err) {
        console.error('Error getting session:', err);
        setStatus('error');
        setMessage('Could not verify payment. Redirecting...');
        setTimeout(() => navigate('/sites'), 2000);
      }
    }

    redirectToSettings();
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Processing...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h1>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Error</h1>
          </>
        )}
        <p className="text-slate-600 mb-4">{message}</p>
        {status === 'loading' && (
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        )}
      </div>
    </div>
  );
}
