import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ExternalLink, X, Globe, Clock, Crown } from 'lucide-react';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

interface SiteBilling {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'cancelled';
  trialEndsAt?: string;
  currentPeriodEnd?: string;
}

export function meta() {
  return [
    { title: `Edit Site - Luna Sites` },
    { name: 'description', content: 'Edit your Luna Sites website' },
  ];
}

export default function EditSite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { siteId } = useParams();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<SiteBilling | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load site data
  useEffect(() => {
    if (user && siteId) {
      loadSite();
    }
  }, [user, siteId]);

  const loadSite = async () => {
    try {
      setLoading(true);
      const siteData = await api.getSite(siteId!);
      setSite(siteData);

      // Load billing info for this site
      try {
        const subscriptions = await api.getSubscriptions();
        const siteBilling = subscriptions.subscriptions?.find(
          (sub: any) => sub.siteId === siteId
        );
        if (siteBilling) {
          setBilling({
            plan: siteBilling.plan || 'free',
            status: siteBilling.status || 'trialing',
            trialEndsAt: siteBilling.currentPeriodEnd,
            currentPeriodEnd: siteBilling.currentPeriodEnd,
          });
        } else {
          // No subscription = free trial
          setBilling({
            plan: 'free',
            status: 'trialing',
          });
        }
      } catch (billingErr) {
        console.error('Error loading billing:', billingErr);
        // Default to trial if billing fails
        setBilling({ plan: 'free', status: 'trialing' });
      }
    } catch (err) {
      console.error('Error loading site:', err);
      setError('Site not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  // Handle messages from iframe (for SSO)
  const handleIframeMessage = useCallback(
    async (event: MessageEvent) => {
      console.log('[Dashboard] Message received:', event.data?.type, 'from:', event.origin);
      if (!site) return;

      // Check if it's a ready message from the iframe
      if (event.data?.type === 'LUNA_AUTH_READY') {
        console.log('[Dashboard] LUNA_AUTH_READY received, sending token...');
        try {
          const firebaseUser = auth.currentUser;
          console.log('[Dashboard] Firebase user:', !!firebaseUser);
          if (firebaseUser) {
            const token = await firebaseUser.getIdToken();
            console.log('[Dashboard] Sending LUNA_AUTH to:', `https://${site.domain}`);
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: 'LUNA_AUTH',
                firebaseToken: token,
              },
              `https://${site.domain}`
            );
          }
        } catch (error) {
          console.error('Error sending auth token to iframe:', error);
        }
      }

      // Handle auth response
      if (event.data?.type === 'LUNA_AUTH_RESPONSE') {
        console.log('[Dashboard] LUNA_AUTH_RESPONSE:', event.data);
        setIframeLoading(false);
        if (!event.data.success) {
          console.error('Iframe auth failed:', event.data.error);
        }
      }
    },
    [site]
  );

  // Listen for iframe messages
  useEffect(() => {
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [handleIframeMessage]);

  const handleBack = () => {
    navigate('/sites');
  };

  // Get subscription status display
  const getSubscriptionInfo = () => {
    if (!billing) return null;

    const planLabels: Record<string, string> = {
      free: 'Free Trial',
      starter: 'Starter',
      pro: 'Pro',
      enterprise: 'Pro 2Y',
    };

    // Calculate days left - for trial, use site.createdAt + 29 days
    let daysLeft: number | null = null;
    if (billing.status === 'trialing' || billing.plan === 'free') {
      // Trial is 29 days from site creation
      if (site?.createdAt) {
        const trialEndDate = new Date(site.createdAt);
        trialEndDate.setDate(trialEndDate.getDate() + 29);
        daysLeft = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      }
    } else if (billing.currentPeriodEnd) {
      daysLeft = Math.ceil((new Date(billing.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }

    if (billing.status === 'trialing' || billing.plan === 'free') {
      return {
        label: daysLeft !== null && daysLeft > 0 ? `Trial: ${daysLeft} days left` : 'Trial expired',
        urgent: daysLeft === null || daysLeft <= 7,
        icon: Clock,
      };
    }

    if (billing.status === 'past_due') {
      return {
        label: 'Payment overdue',
        urgent: true,
        icon: Clock,
      };
    }

    return {
      label: planLabels[billing.plan] || 'Active',
      urgent: false,
      icon: Crown,
    };
  };

  // Check if custom domain is available
  const canUseCustomDomain = billing && ['pro', 'enterprise', 'monthly', 'annual', 'biennial'].includes(billing.plan);

  const subscriptionInfo = getSubscriptionInfo();

  // Loading state
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="text-purple-600 hover:text-purple-700 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!site) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Editor Header - minimal purple gradient bar */}
      <header className="h-7 bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-purple-200 hover:text-white transition-colors text-xs"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Dashboard</span>
          </button>
          <div className="h-3 w-px bg-purple-400/30" />
          <span className="text-purple-200/70 text-xs">
            {site.name}
          </span>
        </div>

        {/* Center: Custom domain prompt + Subscription status */}
        <div className="flex items-center gap-3">
          {/* Custom domain prompt */}
          {!canUseCustomDomain && (
            <Link
              to={`/sites/${siteId}/settings`}
              className="flex items-center gap-1.5 text-yellow-200 hover:text-white transition-colors text-xs bg-white/10 px-2 py-0.5 rounded"
            >
              <Globe className="w-3 h-3" />
              <span>Want a custom domain? Upgrade now</span>
            </Link>
          )}
          {canUseCustomDomain && !site.customDomain && (
            <Link
              to={`/sites/${siteId}/settings`}
              className="flex items-center gap-1.5 text-green-200 hover:text-white transition-colors text-xs bg-white/10 px-2 py-0.5 rounded"
            >
              <Globe className="w-3 h-3" />
              <span>Connect your custom domain</span>
            </Link>
          )}

          {/* Subscription status */}
          {subscriptionInfo && (
            <div
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                subscriptionInfo.urgent
                  ? 'bg-red-500/20 text-red-200'
                  : 'bg-white/10 text-purple-200'
              }`}
            >
              <subscriptionInfo.icon className="w-3 h-3" />
              <span>{subscriptionInfo.label}</span>
              {(subscriptionInfo.urgent || billing?.plan === 'free' || billing?.plan === 'starter') && (
                <Link
                  to={`/sites/${siteId}/settings`}
                  className="ml-1 underline hover:text-white"
                >
                  Upgrade
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://${site.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-200 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={handleBack}
            className="text-purple-200 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Iframe Container */}
      <div className="flex-1 relative">
        {iframeLoading && (
          <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading editor...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={`https://${site.domain}/admin`}
          className="w-full h-full border-0"
          onLoad={() => setIframeLoading(false)}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
