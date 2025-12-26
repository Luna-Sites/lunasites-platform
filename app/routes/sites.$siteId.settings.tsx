import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import type { Route } from "./+types/sites.$siteId.settings";
import { useAuth } from "../contexts/AuthContext";
import { api, type Site } from '../lib/api';
import { Settings, LogOut, HelpCircle, Layout, ArrowLeft, Globe, CheckCircle, XCircle, Clock, Copy, ExternalLink, Trash2, RefreshCw, Shield, Plus, ShoppingCart, X, Crown, Lock } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import DomainSearch from '../components/DomainSearch';

interface SiteBilling {
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'cancelled';
  currentPeriodEnd?: string;
}

const Logo = '/logo/logo_lunasites_gradient.png';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Site Settings - Luna Sites" },
    { name: "description", content: "Manage your site settings" },
  ];
}

interface CustomDomainStatus {
  domain: string;
  status: 'pending' | 'verifying' | 'verified' | 'active' | 'error';
  verificationStatus: 'unverified' | 'verified';
  certificateStatus: 'pending' | 'issued' | 'error';
  sslStatus?: string;
  addedAt: string;
  verifiedAt?: string;
  activatedAt?: string;
  errorMessage?: string;
}

interface DnsRecord {
  type: string;
  host: string;
  value: string;
  description?: string;
  configured?: boolean;
}

interface DnsInstructions {
  records: DnsRecord[];
  cnameTarget: string;
  flyIpv4: string;
  flyIpv6?: string;
  note?: string;
}

interface DomainEntry {
  domain: CustomDomainStatus;
  dnsInstructions: DnsInstructions | null;
}

export default function SiteSettings() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [domainOption, setDomainOption] = useState<'select' | 'register' | 'buy' | 'transfer' | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDomainPurchase, setShowDomainPurchase] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [billing, setBilling] = useState<SiteBilling | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address1: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: 'US',
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  // Check if a domain is working (SSL Ready)
  const isDomainWorking = (domain: CustomDomainStatus) =>
    domain.sslStatus === 'Ready' || domain.certificateStatus === 'issued';

  // Load site and domain status
  useEffect(() => {
    async function loadData() {
      if (!siteId) return;

      try {
        setLoading(true);
        const [siteData, domainData] = await Promise.all([
          api.getSite(siteId),
          api.getCustomDomains(siteId),
        ]);

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
          setBilling({ plan: 'free', status: 'trialing' });
        }

        // Map array of domains to DomainEntry format
        if (domainData.customDomains && domainData.customDomains.length > 0) {
          const entries = domainData.customDomains.map(d => ({
            domain: d,
            dnsInstructions: domainData.dnsInstructions || null
          }));
          setDomains(entries);

          // Auto-activate domains with SSL Ready
          for (const d of domainData.customDomains) {
            if (d.sslStatus === 'Ready' && d.status !== 'active') {
              api.activateCustomDomain(siteId, d.domain).catch(console.error);
            }
          }
        } else {
          setDomains([]);
        }
      } catch (err) {
        console.error('Error loading site data:', err);
        setError('Failed to load site data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [siteId]);

  // Check if plan allows custom domains
  const canUseCustomDomain = billing && ['pro', 'enterprise'].includes(billing.plan);

  // Handle upgrade to Pro
  const handleUpgrade = async (plan: 'monthly' | 'annual' | 'biennial') => {
    if (!siteId) return;
    setUpgradeLoading(true);
    try {
      const settingsUrl = `${window.location.origin}/sites/${siteId}/settings`;
      const result = await api.createSubscriptionCheckout({
        siteId,
        plan,
        successUrl: settingsUrl,
        cancelUrl: settingsUrl,
        withTrial: billing?.status === 'trialing',
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError('Failed to start upgrade process');
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Refresh domain status
  const refreshStatus = async () => {
    if (!siteId) return;

    try {
      setActionLoading('refresh');
      const domainData = await api.getCustomDomains(siteId);

      if (domainData.customDomains && domainData.customDomains.length > 0) {
        const entries = domainData.customDomains.map(d => ({
          domain: d,
          dnsInstructions: domainData.dnsInstructions || null
        }));
        setDomains(entries);

        // Auto-activate domains with SSL Ready
        for (const d of domainData.customDomains) {
          if (d.sslStatus === 'Ready' && d.status !== 'active') {
            await api.activateCustomDomain(siteId, d.domain);
          }
        }

        // Refresh again to get updated statuses
        const updatedData = await api.getCustomDomains(siteId);
        if (updatedData.customDomains && updatedData.customDomains.length > 0) {
          const updatedEntries = updatedData.customDomains.map(d => ({
            domain: d,
            dnsInstructions: updatedData.dnsInstructions || null
          }));
          setDomains(updatedEntries);
        }
      } else {
        setDomains([]);
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Add custom domain (for external domains)
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !newDomain.trim()) return;

    setError(null);
    setSuccess(null);
    setActionLoading('add');

    try {
      const result = await api.addCustomDomain(siteId, newDomain.trim());
      const newEntry: DomainEntry = {
        domain: {
          domain: result.domain,
          status: 'pending',
          verificationStatus: 'unverified',
          certificateStatus: 'pending',
          sslStatus: result.sslStatus,
          addedAt: new Date().toISOString(),
        },
        dnsInstructions: result.dnsInstructions
      };
      setDomains(prev => [...prev, newEntry]);
      setNewDomain('');
      setShowAddForm(false);
      setSuccess('Domain added. Configure DNS records below.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setActionLoading(null);
    }
  };

  // Transfer Luna Sites purchased domain (allows moving between sites)
  const handleTransferDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !newDomain.trim()) return;

    setError(null);
    setSuccess(null);
    setActionLoading('add');

    try {
      // Pass autoConfigureDns: true to allow transfer and auto-configure DNS
      const result = await api.addCustomDomain(siteId, newDomain.trim(), true);
      const newEntry: DomainEntry = {
        domain: {
          domain: result.domain,
          status: result.sslStatus === 'Ready' ? 'active' : 'pending',
          verificationStatus: result.sslStatus === 'Ready' ? 'verified' : 'unverified',
          certificateStatus: result.sslStatus === 'Ready' ? 'issued' : 'pending',
          sslStatus: result.sslStatus,
          addedAt: new Date().toISOString(),
        },
        dnsInstructions: result.dnsInstructions
      };
      setDomains(prev => [...prev, newEntry]);
      setNewDomain('');
      setShowAddForm(false);
      setDomainOption(null);
      setSuccess('Domain connected successfully! DNS has been configured automatically.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect domain');
    } finally {
      setActionLoading(null);
    }
  };

  // Remove domain
  const handleRemove = async (domainToRemove: string) => {
    if (!siteId) return;

    if (!confirm(`Are you sure you want to remove ${domainToRemove}?`)) return;

    setError(null);
    setSuccess(null);
    setActionLoading(`remove-${domainToRemove}`);

    try {
      await api.removeCustomDomain(siteId, domainToRemove);
      setDomains(prev => prev.filter(d => d.domain.domain !== domainToRemove));
      setSuccess('Custom domain removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove domain');
    } finally {
      setActionLoading(null);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle domain selection from search
  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setShowDomainPurchase(true);
  };

  // Handle domain purchase
  const handlePurchaseDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;

    // Validate contact form
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'stateProvince', 'postalCode', 'country'];
    for (const field of requiredFields) {
      if (!contactForm[field as keyof typeof contactForm]) {
        setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    setError(null);
    setPurchaseLoading(true);

    try {
      const result = await api.purchaseDomain({
        domain: selectedDomain,
        years: 1,
        contact: contactForm,
      });

      if (result.success) {
        // Automatically add the purchased domain to the site with auto DNS configuration
        try {
          await api.addCustomDomain(siteId!, selectedDomain, true);
          // Refresh domains list
          const domainsResponse = await api.getCustomDomains(siteId!);
          const domainsWithInstructions: DomainEntry[] = domainsResponse.customDomains.map(d => ({
            domain: d,
            dnsInstructions: domainsResponse.dnsInstructions || null,
          }));
          setDomains(domainsWithInstructions);
          setSuccess(`Domain ${selectedDomain} purchased and connected successfully!`);
        } catch (connectErr) {
          // Domain purchased but failed to connect - still show success
          setSuccess(`Domain ${selectedDomain} purchased successfully! You can connect it using "Use domain bought through Luna Sites".`);
        }

        setShowDomainPurchase(false);
        setSelectedDomain(null);
        setDomainOption(null);
        setShowAddForm(false);
        setContactForm({
          firstName: '',
          lastName: '',
          email: user?.email || '',
          phone: '',
          address1: '',
          city: '',
          stateProvince: '',
          postalCode: '',
          country: 'US',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purchase domain');
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Please sign in</h1>
          <a href="/login" className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] text-white px-6 py-3 rounded-lg hover:from-[#4A2875] hover:to-[#C01AA3] transition-all">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A318F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white grid grid-cols-1 lg:grid-cols-[1fr_30%]">
      {/* Left Column - Main Content */}
      <div className="flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="cursor-pointer">
                <img src={Logo} alt="Luna Sites" className="w-[130px]" />
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5A318F] to-[#D920B7] flex items-center justify-center text-white text-sm cursor-pointer font-semibold">
                  {userInitials}
                </div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <a
                    href="/sites"
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-lg"
                  >
                    <Layout className="w-4 h-4" />
                    My Sites
                  </a>
                  <a
                    href="/profile"
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </a>
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
        <div className="px-6 py-8 flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {/* Back button */}
            <button
              onClick={() => navigate('/sites')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sites
            </button>

            <h1 className="text-xl text-slate-500 font-medium mb-2">Site Settings</h1>
            {site && (
              <p className="text-2xl font-semibold text-slate-900 mb-8">{site.name}</p>
            )}

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                {success}
              </div>
            )}

            <div className="space-y-8">
              {/* Subscription Status */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Subscription
                </h2>

                {billing && (
                  <div className="space-y-4">
                    {/* Current Plan Display */}
                    <div className={`p-4 rounded-lg ${
                      billing.plan === 'free' || billing.status === 'trialing'
                        ? 'bg-amber-50 border border-amber-200'
                        : billing.status === 'past_due'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {billing.plan === 'free' && 'Free Trial'}
                            {billing.plan === 'starter' && 'Starter Plan'}
                            {billing.plan === 'pro' && 'Pro Plan'}
                            {billing.plan === 'enterprise' && 'Pro 2 Years'}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {billing.status === 'trialing' && (
                              <>
                                <Clock className="w-4 h-4 inline mr-1" />
                                {(() => {
                                  // Calculate trial end date from site creation (29 days)
                                  if (site?.createdAt) {
                                    const trialEndDate = new Date(site.createdAt);
                                    trialEndDate.setDate(trialEndDate.getDate() + 29);
                                    const daysLeft = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    if (daysLeft > 0) {
                                      return `Trial ends ${trialEndDate.toLocaleDateString()} (${daysLeft} days left)`;
                                    }
                                    return 'Trial expired';
                                  }
                                  return '29 days free trial';
                                })()}
                              </>
                            )}
                            {billing.status === 'active' && billing.currentPeriodEnd && (
                              <>Next billing: {new Date(billing.currentPeriodEnd).toLocaleDateString()}</>
                            )}
                            {billing.status === 'past_due' && (
                              <span className="text-red-600">Payment overdue - please update your payment method</span>
                            )}
                            {billing.status === 'cancelled' && 'Subscription cancelled'}
                          </p>
                        </div>
                        {(billing.plan === 'free' || billing.plan === 'starter') && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                            {billing.plan === 'starter' ? 'No custom domain' : 'Trial'}
                          </span>
                        )}
                        {billing.plan === 'pro' && billing.status === 'active' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Upgrade Options */}
                    {(billing.plan === 'free' || billing.plan === 'starter') && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-700 mb-3">
                          {billing.plan === 'starter'
                            ? 'Upgrade to Pro to use custom domains:'
                            : 'Choose a plan to continue after trial:'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <button
                            onClick={() => handleUpgrade('monthly')}
                            disabled={upgradeLoading}
                            className="p-4 border border-slate-200 rounded-lg hover:border-[#5A318F] hover:bg-purple-50 transition-all text-left"
                          >
                            <p className="font-semibold text-slate-900">Pro Monthly</p>
                            <p className="text-lg font-bold text-[#5A318F]">€13<span className="text-sm font-normal text-slate-500">/mo</span></p>
                            <p className="text-xs text-slate-500 mt-1">Custom domain included</p>
                          </button>
                          <button
                            onClick={() => handleUpgrade('annual')}
                            disabled={upgradeLoading}
                            className="p-4 border-2 border-[#5A318F] rounded-lg bg-purple-50 hover:bg-purple-100 transition-all text-left relative"
                          >
                            <span className="absolute -top-2 right-2 bg-[#D920B7] text-white text-xs px-2 py-0.5 rounded">Save 23%</span>
                            <p className="font-semibold text-slate-900">Pro Annual</p>
                            <p className="text-lg font-bold text-[#5A318F]">€9.99<span className="text-sm font-normal text-slate-500">/mo</span></p>
                            <p className="text-xs text-slate-500 mt-1">€119.88/year</p>
                          </button>
                          <button
                            onClick={() => handleUpgrade('biennial')}
                            disabled={upgradeLoading}
                            className="p-4 border border-slate-200 rounded-lg hover:border-[#5A318F] hover:bg-purple-50 transition-all text-left relative"
                          >
                            <span className="absolute -top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">Best Value</span>
                            <p className="font-semibold text-slate-900">Pro 2 Years</p>
                            <p className="text-lg font-bold text-[#5A318F]">€6.99<span className="text-sm font-normal text-slate-500">/mo</span></p>
                            <p className="text-xs text-slate-500 mt-1">€167.76/2 years</p>
                          </button>
                        </div>
                        {billing.plan === 'free' && (
                          <button
                            onClick={() => handleUpgrade('starter' as any)}
                            disabled={upgradeLoading}
                            className="w-full mt-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-center text-sm text-slate-600"
                          >
                            Or continue with <strong>Starter at €4.99/mo</strong> (no custom domain)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current Domain */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Luna Sites Domain
                </h2>

                {site && (
                  <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-slate-900">{site.domain}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span>
                    </div>
                    <a
                      href={`https://${site.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5A318F] hover:text-[#4A2875] flex items-center gap-1 text-sm"
                    >
                      Visit <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* Custom Domains */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Custom Domains
                    {!canUseCustomDomain && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Pro required
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2">
                    {canUseCustomDomain && domains.length > 0 && (
                      <button
                        onClick={refreshStatus}
                        disabled={actionLoading === 'refresh'}
                        className="text-slate-500 hover:text-slate-700 p-1"
                        title="Refresh status"
                      >
                        <RefreshCw className={`w-4 h-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    {canUseCustomDomain && !showAddForm && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="text-[#5A318F] hover:text-[#4A2875] flex items-center gap-1 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Domain
                      </button>
                    )}
                  </div>
                </div>

                {/* Upgrade prompt for non-Pro users */}
                {!canUseCustomDomain && (
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100 text-center">
                    <Lock className="w-10 h-10 text-[#5A318F] mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-900 mb-2">Custom Domains require a Pro plan</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Upgrade to Pro to connect your own domain like <strong>yourbrand.com</strong>
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleUpgrade('annual')}
                        disabled={upgradeLoading}
                        className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white px-6 py-2.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        {upgradeLoading ? 'Loading...' : 'Upgrade to Pro - €9.99/mo'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Add Domain Options - only show for Pro users */}
                {canUseCustomDomain && showAddForm && !domainOption && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-slate-700 mb-4">How would you like to add a domain?</p>

                    <button
                      onClick={() => setDomainOption('register')}
                      className="w-full p-4 bg-white border border-slate-200 rounded-lg hover:border-[#5A318F] hover:bg-purple-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-[#5A318F]" />
                        <div>
                          <p className="font-medium text-slate-900">I already have a domain</p>
                          <p className="text-sm text-slate-500">Connect a domain you own from another registrar</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setDomainOption('buy')}
                      className="w-full p-4 bg-white border border-slate-200 rounded-lg hover:border-[#5A318F] hover:bg-purple-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 text-[#5A318F]" />
                        <div>
                          <p className="font-medium text-slate-900">Buy a new domain</p>
                          <p className="text-sm text-slate-500">Search and purchase a domain through Luna Sites</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setDomainOption('transfer')}
                      className="w-full p-4 bg-white border border-slate-200 rounded-lg hover:border-[#5A318F] hover:bg-purple-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-[#5A318F]" />
                        <div>
                          <p className="font-medium text-slate-900">Use domain bought through Luna Sites</p>
                          <p className="text-sm text-slate-500">Connect a domain you purchased here</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setShowAddForm(false); setDomainOption(null); }}
                      className="w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Register Own Domain Form */}
                {canUseCustomDomain && showAddForm && domainOption === 'register' && (
                  <form onSubmit={handleAddDomain} className="space-y-4 mb-6 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setDomainOption(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-slate-700">Connect your own domain</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Domain Name
                      </label>
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="example.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none transition-all bg-white"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Enter your domain without http:// or https://
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!newDomain.trim() || actionLoading === 'add'}
                        className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white px-6 py-2.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        {actionLoading === 'add' ? 'Adding...' : 'Add Domain'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddForm(false); setDomainOption(null); setNewDomain(''); }}
                        className="px-4 py-2.5 text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Buy Domain Section */}
                {canUseCustomDomain && showAddForm && domainOption === 'buy' && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setDomainOption(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-slate-700">Buy a new domain</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Search for available domains. Prices shown include a €2 service fee.
                    </p>
                    <DomainSearch onPurchase={handleDomainSelect} />
                    <button
                      onClick={() => { setShowAddForm(false); setDomainOption(null); }}
                      className="w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-4"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Transfer Domain Section */}
                {canUseCustomDomain && showAddForm && domainOption === 'transfer' && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setDomainOption(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-slate-700">Connect Luna Sites domain</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Domain purchased through Luna Sites
                      </label>
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="yourdomain.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none transition-all bg-white"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Enter the domain you bought through Luna Sites
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleTransferDomain}
                        disabled={!newDomain.trim() || actionLoading === 'add'}
                        className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white px-6 py-2.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        {actionLoading === 'add' ? 'Transferring...' : 'Transfer Domain'}
                      </button>
                      <button
                        onClick={() => { setShowAddForm(false); setDomainOption(null); setNewDomain(''); }}
                        className="px-4 py-2.5 text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* No domains message - only show for Pro users */}
                {canUseCustomDomain && domains.length === 0 && !showAddForm && (
                  <div className="text-center py-8 text-slate-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No custom domains configured</p>
                    <p className="text-sm text-slate-400 mt-1">Add a custom domain to use your own URL</p>
                  </div>
                )}

                {/* Domain List */}
                {domains.length > 0 && (
                  <div className="space-y-6">
                    {domains.map((entry, index) => {
                      const { domain: domainStatus, dnsInstructions } = entry;
                      const working = isDomainWorking(domainStatus);

                      return (
                        <div key={domainStatus.domain} className={`${index > 0 ? 'pt-6 border-t border-slate-200' : ''}`}>
                          {/* Domain Info */}
                          <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {working ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Clock className="w-5 h-5 text-amber-500" />
                              )}
                              <span className="font-medium text-slate-900">{domainStatus.domain}</span>
                              {working ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Working
                                </span>
                              ) : (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                  Configuring
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {working && (
                                <a
                                  href={`https://${domainStatus.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#5A318F] hover:text-[#4A2875] flex items-center gap-1 text-sm"
                                >
                                  Visit <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handleRemove(domainStatus.domain)}
                                disabled={actionLoading === `remove-${domainStatus.domain}`}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove domain"
                              >
                                {actionLoading === `remove-${domainStatus.domain}` ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Domain Working Message */}
                          {working && (
                            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                              <Shield className="w-6 h-6 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">Domain is working properly</p>
                                <p className="text-sm text-green-600">SSL certificate is active and your domain is live.</p>
                              </div>
                            </div>
                          )}

                          {/* DNS Instructions - Only show if not working */}
                          {!working && dnsInstructions && (
                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <h3 className="font-medium text-amber-900 mb-3">DNS Configuration Required</h3>
                              <p className="text-sm text-amber-700 mb-4">
                                Add the following DNS records at your domain registrar:
                              </p>

                              {/* Display all DNS records */}
                              <div className="space-y-3">
                                {dnsInstructions.records?.map((record: DnsRecord, idx: number) => (
                                  <div key={idx} className="bg-white rounded-lg p-4 font-mono text-sm border border-amber-100">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs text-slate-500 uppercase font-sans">{record.description}</span>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Type:</span>
                                        <span className="text-slate-900 font-semibold">{record.type}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Host:</span>
                                        <span className="text-slate-900 font-semibold">{record.host}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Value:</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-900 font-semibold break-all text-right">{record.value}</span>
                                          <button
                                            onClick={() => copyToClipboard(record.value)}
                                            className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                                            title="Copy to clipboard"
                                          >
                                            <Copy className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {copied && (
                                <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>
                              )}

                              <p className="text-xs text-amber-600 mt-3">
                                {dnsInstructions.note || 'DNS propagation can take up to 48 hours. Click refresh to check status.'}
                              </p>
                            </div>
                          )}

                          {/* Status Info */}
                          {!working && (
                            <div className="mt-4 flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                              <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-700">Waiting for DNS propagation</p>
                                <p className="text-xs text-slate-500">
                                  SSL Status: {domainStatus.sslStatus || 'Pending'}
                                </p>
                              </div>
                              <button
                                onClick={refreshStatus}
                                disabled={actionLoading === 'refresh'}
                                className="text-[#5A318F] hover:text-[#4A2875] text-sm font-medium"
                              >
                                Check Status
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Domain Purchase Modal */}
      {showDomainPurchase && selectedDomain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Purchase Domain</h3>
                <p className="text-sm text-slate-600">{selectedDomain}</p>
              </div>
              <button
                onClick={() => {
                  setShowDomainPurchase(false);
                  setSelectedDomain(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePurchaseDomain} className="p-6 space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Please provide contact information for domain registration (WHOIS).
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+40747123456"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">Include country code (e.g., +40 for Romania)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  value={contactForm.address1}
                  onChange={(e) => setContactForm(prev => ({ ...prev, address1: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={contactForm.city}
                    onChange={(e) => setContactForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State/Province *</label>
                  <input
                    type="text"
                    value={contactForm.stateProvince}
                    onChange={(e) => setContactForm(prev => ({ ...prev, stateProvince: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    value={contactForm.postalCode}
                    onChange={(e) => setContactForm(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
                  <select
                    value={contactForm.country}
                    onChange={(e) => setContactForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none"
                    required
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="RO">Romania</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={purchaseLoading}
                  className="flex-1 bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {purchaseLoading ? 'Processing...' : `Purchase ${selectedDomain}`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDomainPurchase(false);
                    setSelectedDomain(null);
                  }}
                  className="px-6 py-3 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Right Column - Nebula Background */}
      <div
        className="hidden lg:block bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/nebula-1.png)' }}
      />
    </div>
  );
}
