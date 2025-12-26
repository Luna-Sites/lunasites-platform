import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import type { Route } from "./+types/sites.$siteId.settings";
import { useAuth } from "../contexts/AuthContext";
import { api, type Site } from '../lib/api';
import { Settings, LogOut, HelpCircle, Layout, ArrowLeft, Globe, CheckCircle, XCircle, Clock, Copy, ExternalLink, Trash2, RefreshCw, Shield, Plus, ShoppingCart, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import DomainSearch from '../components/DomainSearch';

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDomainPurchase, setShowDomainPurchase] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
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

  // Add custom domain
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
        setSuccess(`Domain ${selectedDomain} purchased successfully! Order ID: ${result.orderId}`);
        setShowDomainPurchase(false);
        setSelectedDomain(null);
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
                  </h2>
                  <div className="flex items-center gap-2">
                    {domains.length > 0 && (
                      <button
                        onClick={refreshStatus}
                        disabled={actionLoading === 'refresh'}
                        className="text-slate-500 hover:text-slate-700 p-1"
                        title="Refresh status"
                      >
                        <RefreshCw className={`w-4 h-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    {!showAddForm && (
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

                {/* Add Domain Form */}
                {showAddForm && (
                  <form onSubmit={handleAddDomain} className="space-y-4 mb-6 p-4 bg-slate-50 rounded-lg">
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
                        onClick={() => { setShowAddForm(false); setNewDomain(''); }}
                        className="px-4 py-2.5 text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* No domains message */}
                {domains.length === 0 && !showAddForm && (
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

              {/* Buy a Domain */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Buy a Domain
                </h2>
                <p className="text-slate-600 mb-4">
                  Search and purchase a new domain for your site.
                </p>
                <DomainSearch onPurchase={handleDomainSelect} />
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
                  placeholder="+1.2125551234"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none"
                  required
                />
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
