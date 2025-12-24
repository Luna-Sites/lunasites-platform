import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import type { Route } from "./+types/sites.$siteId.settings";
import { useAuth } from "../contexts/AuthContext";
import { api, type Site } from '../lib/api';
import { Settings, LogOut, HelpCircle, Layout, ArrowLeft, Globe, CheckCircle, XCircle, Clock, Copy, ExternalLink, Trash2, RefreshCw, Shield } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

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
  addedAt: string;
  verifiedAt?: string;
  activatedAt?: string;
  errorMessage?: string;
}

interface VerificationSteps {
  domainAssigned: boolean;
  dnsConfigured: boolean;
}

interface DnsRecord {
  type: string;
  host: string;
  value: string;
  description?: string;
}

interface DnsInstructions {
  records: DnsRecord[];
  cnameTarget: string;
  flyIpv4: string;
  note?: string;
}

export default function SiteSettings() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [customDomain, setCustomDomain] = useState<CustomDomainStatus | null>(null);
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstructions | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState<VerificationSteps | null>(null);

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

  // Load site and domain status
  useEffect(() => {
    async function loadData() {
      if (!siteId) return;

      try {
        setLoading(true);
        const [siteData, domainData] = await Promise.all([
          api.getSite(siteId),
          api.getCustomDomainStatus(siteId),
        ]);

        setSite(siteData);
        setCustomDomain(domainData.customDomain);
        setDnsInstructions(domainData.dnsInstructions || null);
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
      const domainData = await api.getCustomDomainStatus(siteId);
      setCustomDomain(domainData.customDomain);
      setDnsInstructions(domainData.dnsInstructions || null);
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
      setCustomDomain({
        domain: result.domain,
        status: 'pending',
        verificationStatus: 'unverified',
        certificateStatus: 'pending',
        addedAt: new Date().toISOString(),
      });
      setDnsInstructions(result.dnsInstructions);
      setNewDomain('');
      setSuccess('Domain added successfully. Please configure your DNS settings.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setActionLoading(null);
    }
  };

  // Verify DNS (2-step verification)
  const handleVerifyDns = async () => {
    console.log('handleVerifyDns called, siteId:', siteId);
    if (!siteId) {
      console.error('No siteId found!');
      return;
    }

    setError(null);
    setSuccess(null);
    setActionLoading('verify');

    try {
      console.log('Calling api.verifyCustomDomain...');
      const result = await api.verifyCustomDomain(siteId);
      console.log('verifyCustomDomain result:', result);

      // Save verification steps for display
      setVerificationSteps(result.steps);

      if (result.verified) {
        setSuccess(result.message);
        await refreshStatus();
      } else {
        // Show which step failed
        if (!result.steps.domainAssigned) {
          setError('Step 1 failed: Domain is not properly assigned to your site.');
        } else if (!result.steps.dnsConfigured) {
          setError('Step 2 failed: DNS not yet configured. Please add the CNAME record.');
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify DNS');
    } finally {
      setActionLoading(null);
    }
  };

  // Activate domain
  const handleActivate = async () => {
    if (!siteId) return;

    setError(null);
    setSuccess(null);
    setActionLoading('activate');

    try {
      const result = await api.activateCustomDomain(siteId);
      setSuccess(result.message);
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate domain');
    } finally {
      setActionLoading(null);
    }
  };

  // Remove domain
  const handleRemove = async () => {
    if (!siteId) return;

    if (!confirm('Are you sure you want to remove this custom domain?')) return;

    setError(null);
    setSuccess(null);
    setActionLoading('remove');

    try {
      await api.removeCustomDomain(siteId);
      setCustomDomain(null);
      setDnsInstructions(null);
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
                  Current Domain
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

              {/* Custom Domain */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Custom Domain
                  </h2>
                  {customDomain && (
                    <button
                      onClick={refreshStatus}
                      disabled={actionLoading === 'refresh'}
                      className="text-slate-500 hover:text-slate-700 p-1"
                      title="Refresh status"
                    >
                      <RefreshCw className={`w-4 h-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>

                {!customDomain ? (
                  /* Add Domain Form */
                  <form onSubmit={handleAddDomain} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Domain Name
                      </label>
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="example.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none transition-all"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Enter your domain without http:// or https://
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={!newDomain.trim() || actionLoading === 'add'}
                      className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white px-6 py-2.5 rounded-lg transition-all disabled:opacity-50"
                    >
                      {actionLoading === 'add' ? 'Adding...' : 'Add Domain'}
                    </button>
                  </form>
                ) : (
                  /* Domain Status */
                  <div className="space-y-6">
                    {/* Domain Info */}
                    <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {customDomain.status === 'active' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : customDomain.status === 'error' ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500" />
                        )}
                        <span className="font-medium text-slate-900">{customDomain.domain}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          customDomain.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : customDomain.status === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {customDomain.status.charAt(0).toUpperCase() + customDomain.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* DNS Instructions */}
                    {dnsInstructions && customDomain.status !== 'active' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-3">DNS Configuration Required</h3>
                        <p className="text-sm text-blue-700 mb-4">
                          Add the following DNS records at your domain registrar:
                        </p>

                        {/* Display all DNS records */}
                        <div className="space-y-3">
                          {dnsInstructions.records?.map((record, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 font-mono text-sm">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-slate-500 uppercase">{record.description}</span>
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
                                    <span className="text-slate-900 font-semibold break-all">{record.value}</span>
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

                        <p className="text-xs text-blue-600 mt-3">
                          {dnsInstructions.note || 'Note: DNS propagation can take up to 48 hours.'}
                        </p>
                      </div>
                    )}

                    {/* Verification Steps */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-slate-700">Verification Steps</h3>

                      {/* Step 1: Domain Assigned */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          verificationSteps?.domainAssigned
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          1
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">Domain Assigned</p>
                          <p className="text-xs text-slate-500">Domain is registered in our system</p>
                        </div>
                        {verificationSteps?.domainAssigned ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : verificationSteps !== null ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-slate-300" />
                        )}
                      </div>

                      {/* Step 2: DNS Configured */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          verificationSteps?.dnsConfigured || customDomain.verificationStatus === 'verified'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">DNS Configured</p>
                          <p className="text-xs text-slate-500">Domain is pointing to our services</p>
                        </div>
                        {verificationSteps?.dnsConfigured || customDomain.verificationStatus === 'verified' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : verificationSteps !== null ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-slate-300" />
                        )}
                      </div>

                      {/* Step 3: SSL Certificate */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          customDomain.certificateStatus === 'issued'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          3
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">SSL Certificate</p>
                          <p className="text-xs text-slate-500">Secure connection enabled</p>
                        </div>
                        {customDomain.certificateStatus === 'issued' ? (
                          <Shield className="w-5 h-5 text-green-500" />
                        ) : customDomain.certificateStatus === 'error' ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : customDomain.verificationStatus === 'verified' ? (
                          <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                        ) : (
                          <Clock className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {customDomain.status !== 'active' && customDomain.verificationStatus !== 'verified' && (
                        <button
                          onClick={handleVerifyDns}
                          disabled={actionLoading === 'verify'}
                          className="bg-[#5A318F] hover:bg-[#4A2875] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === 'verify' ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify DNS'
                          )}
                        </button>
                      )}

                      {customDomain.status !== 'active' &&
                       customDomain.verificationStatus === 'verified' &&
                       customDomain.certificateStatus === 'issued' && (
                        <button
                          onClick={handleActivate}
                          disabled={actionLoading === 'activate'}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {actionLoading === 'activate' ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Activate Domain
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={handleRemove}
                        disabled={actionLoading === 'remove'}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === 'remove' ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Remove Domain
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Nebula Background */}
      <div
        className="hidden lg:block bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/nebula-1.png)' }}
      />
    </div>
  );
}
