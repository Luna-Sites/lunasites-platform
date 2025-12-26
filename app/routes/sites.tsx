import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from './+types/sites';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  MoreVertical,
  ExternalLink,
  Settings,
  LogOut,
  HelpCircle,
  Trash2,
  Layers,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
const Logo = '/logo/logo_lunasites_gradient.png';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { api } from '../lib/api';
import { ASSETS } from '../data/wizard-data';

// Lazy iframe that only loads when visible in viewport
function LazyIframe({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible
        }
      },
      { rootMargin: '100px' } // Start loading 100px before entering viewport
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full overflow-hidden">
      {isVisible ? (
        <iframe
          src={src}
          title={title}
          className="w-[200%] h-[200%] origin-top-left pointer-events-none"
          style={{ transform: 'scale(0.5)' }}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading preview...</div>
        </div>
      )}
    </div>
  );
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'My Sites - Luna Sites' },
    { name: 'description', content: 'Manage your Luna Sites websites' },
  ];
}

export default function Sites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ siteId: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      loadSites();
    }
  }, [user]);

  const loadSites = async () => {
    try {
      const [sites, subscriptionsData] = await Promise.all([
        api.getUserSites(),
        api.getSubscriptions(),
      ]);

      // Create a map of siteId -> billing info
      const billingMap = new Map<string, any>();
      if (subscriptionsData?.subscriptions) {
        subscriptionsData.subscriptions.forEach((sub: any) => {
          billingMap.set(sub.siteId, sub);
        });
      }

      if (sites && sites.length > 0) {
        // Fetch custom domains for each site in parallel
        const sitesWithDomains = await Promise.all(
          sites.map(async (site: any, index: number) => {
            let customDomains: string[] = [];
            try {
              const domainData = await api.getCustomDomains(site.siteId);
              if (domainData.customDomains && domainData.customDomains.length > 0) {
                customDomains = domainData.customDomains
                  .filter((d: any) => d.status === 'active' || d.status === 'verified')
                  .map((d: any) => d.domain);
              }
            } catch (err) {
              // Silently fail - custom domains are optional
            }

            const primaryDomain = site.domain || `${site.siteId}.luna-sites.com`;

            // Get billing info for this site
            const billing = billingMap.get(site.siteId);
            const createdAt = new Date(site.createdAt);
            const now = new Date();

            // Calculate trial info (29 days from creation)
            const trialEndDate = new Date(createdAt);
            trialEndDate.setDate(trialEndDate.getDate() + 29);
            const trialDaysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const trialExpired = trialDaysLeft <= 0;

            // Determine plan and billing status
            const plan = billing?.plan || 'free';
            const billingStatus = billing?.status || (trialExpired ? 'expired' : 'trial');
            const nextBillingDate = billing?.currentPeriodEnd
              ? new Date(billing.currentPeriodEnd).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;

            return {
              id: site.id || index + 1,
              siteId: site.siteId,
              title: site.name || 'Untitled Website',
              url: primaryDomain,
              customDomains: customDomains.filter((d: string) => d !== primaryDomain),
              thumbnail: site.screenshotUrl || null,
              createdDate: createdAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              lastEdited: 'Recently',
              status: site.status === 'active' ? 'Published' : 'Draft',
              views: '0',
              template: 'Custom',
              // Billing info
              plan,
              billingStatus,
              trialDaysLeft: trialExpired ? 0 : trialDaysLeft,
              trialExpired,
              nextBillingDate,
            };
          })
        );
        setWebsites(sitesWithDomains);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCreateWebsite = () => {
    window.location.href = '/builder';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleEditSite = (siteId: string) => {
    navigate(`/sites/${siteId}/edit`);
  };

  const handleDeleteSite = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      await api.deleteSite(deleteConfirm.siteId);
      setDeleteConfirm(null);
      loadSites(); // Reload the list
    } catch (error) {
      console.error('Error deleting site:', error);
      alert('Failed to delete site. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Show loading while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  const filteredWebsites = websites.filter(
    (site) =>
      site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.url.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Get user initials for avatar
  const userInitials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  // Placeholder site card for empty state
  const placeholderSite = {
    id: 'placeholder',
    title: 'Your First Website',
    url: 'your-site.luna-sites.com',
    thumbnail: '/images/nebula-1.png',
    createdDate: '-',
    lastEdited: '-',
    status: 'Not Created',
    views: '-',
    template: '-',
    plan: null,
    trialExpired: false,
    trialDaysLeft: 0,
    nextBillingDate: null,
  };

  const sitesToDisplay =
    filteredWebsites.length > 0 ? filteredWebsites : [placeholderSite];
  const isPlaceholder = filteredWebsites.length === 0;

  return (
    <div className="h-screen bg-white grid grid-cols-1 lg:grid-cols-[1fr_30%] overflow-hidden">
      {/* Left Column - Main Content (scrollable) */}
      <div className="flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={handleGoHome} className="cursor-pointer">
                <img src={Logo} alt="Luna Sites" className="w-[130px]" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.email || 'User'}
                    className="w-8 h-8 rounded-full cursor-pointer"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5A318F] to-[#D920B7] flex items-center justify-center text-white text-sm cursor-pointer font-semibold">
                    {userInitials}
                  </div>
                )}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={() => (window.location.href = '/templates')}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-lg"
                  >
                    <Layers className="w-4 h-4" />
                    Templates
                  </button>
                  <button
                    onClick={() => (window.location.href = '/profile')}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Help
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-b-lg border-t border-slate-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-6 py-8 flex-1">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl text-slate-500 font-medium">My Websites</h1>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 h-10"
                />
              </div>

              {/* Create Website Button */}
              <Button
                onClick={handleCreateWebsite}
                className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white h-10"
              >
                Create New Website
              </Button>
            </div>
          </div>

          {/* Websites List */}
          {loading ? (
            <div className="text-center py-20">
              <div className="text-slate-400 mb-4">
                Loading your websites...
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {sitesToDisplay.map((site) => (
                <div
                  key={site.id}
                  className={`bg-white border border-slate-200 rounded-lg overflow-hidden transition-shadow ${isPlaceholder ? 'border-dashed border-2 border-purple-300' : 'hover:shadow-lg'}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    {/* Left Column - Website Preview */}
                    <div className="p-6 flex flex-col">
                      <div
                        className={`relative rounded-lg overflow-hidden aspect-[16/10] ${isPlaceholder ? 'bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center' : 'bg-slate-100'}`}
                      >
                        {isPlaceholder ? (
                          <div className="text-center p-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#5A318F] to-[#D920B7] flex items-center justify-center">
                              <span className="text-white text-2xl">+</span>
                            </div>
                            <p className="text-slate-600 font-medium">
                              Create your first website
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                              Get started with Luna Sites
                            </p>
                          </div>
                        ) : (
                          <LazyIframe
                            src={`https://${site.url}`}
                            title={site.title}
                          />
                        )}
                      </div>
                    </div>

                    {/* Right Column - Website Details */}
                    <div className="p-6 border-l border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <h3
                              className={`text-xl mb-2 font-semibold ${isPlaceholder ? 'text-slate-400' : 'text-slate-900'}`}
                            >
                              {site.title}
                            </h3>
                            {!isPlaceholder ? (
                              <div className="space-y-1">
                                <a
                                  href={`https://${site.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                >
                                  {site.url}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                {site.customDomains && site.customDomains.length > 0 && (
                                  <div className="space-y-0.5">
                                    {site.customDomains.map((domain: string) => (
                                      <a
                                        key={domain}
                                        href={`https://${domain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                      >
                                        {domain}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                {site.url}
                              </span>
                            )}
                          </div>

                          {/* Three-dot menu - only for real sites */}
                          {!isPlaceholder && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === site.id ? null : site.id,
                                  )
                                }
                                className="p-1 hover:bg-slate-100 rounded"
                              >
                                <MoreVertical className="w-5 h-5 text-slate-400" />
                              </button>

                              {openMenuId === site.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `https://${site.url}`,
                                        '_blank',
                                      )
                                    }
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Open Website
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      navigate(`/sites/${site.siteId}/settings`);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setDeleteConfirm({ siteId: site.siteId, title: site.title });
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Plan Badge */}
                        {!isPlaceholder && (
                          <div className="mb-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                site.plan === 'pro'
                                  ? 'bg-purple-100 text-purple-800'
                                  : site.plan === 'starter'
                                    ? 'bg-blue-100 text-blue-800'
                                    : site.trialExpired
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {site.plan === 'pro'
                                ? 'Pro'
                                : site.plan === 'starter'
                                  ? 'Starter'
                                  : site.trialExpired
                                    ? 'Trial Expired'
                                    : 'Free Trial'}
                            </span>
                          </div>
                        )}

                        {/* Details Grid */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-500 mb-1 font-medium">
                                Created
                              </p>
                              <p
                                className={`text-sm ${isPlaceholder ? 'text-slate-400' : 'text-slate-900'}`}
                              >
                                {site.createdDate}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1 font-medium">
                                Last Edited
                              </p>
                              <p
                                className={`text-sm ${isPlaceholder ? 'text-slate-400' : 'text-slate-900'}`}
                              >
                                {site.lastEdited}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-500 mb-1 font-medium">
                                Total Views
                              </p>
                              <p
                                className={`text-sm ${isPlaceholder ? 'text-slate-400' : 'text-slate-900'}`}
                              >
                                {site.views}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1 font-medium">
                                {site.plan === 'free' || !site.plan
                                  ? site.trialExpired
                                    ? 'Trial Status'
                                    : 'Trial Ends'
                                  : 'Next Billing'}
                              </p>
                              <p
                                className={`text-sm ${
                                  isPlaceholder
                                    ? 'text-slate-400'
                                    : site.trialExpired && site.plan === 'free'
                                      ? 'text-red-600 font-medium'
                                      : 'text-slate-900'
                                }`}
                              >
                                {isPlaceholder
                                  ? '-'
                                  : site.plan === 'free' || !site.plan
                                    ? site.trialExpired
                                      ? 'Expired'
                                      : `${site.trialDaysLeft} days left`
                                    : site.nextBillingDate || '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={
                          isPlaceholder
                            ? handleCreateWebsite
                            : () => handleEditSite(site.siteId)
                        }
                        className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white mt-6 px-4 py-2 text-sm w-[200px] mx-auto"
                      >
                        {isPlaceholder ? 'Create Website' : 'Edit Website'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Right Column - Fixed background image */}
      <div
        className="hidden lg:block h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${ASSETS.nebulaSitesImg})` }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Website</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?
              This action cannot be undone and all website data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteSite}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete Website'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
