import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from "./+types/sites";
import { useAuth } from "../contexts/AuthContext";
import { Search, MoreVertical, ExternalLink, Settings, LogOut, HelpCircle } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import Logo from "../welcome/logo_mini.png";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { api } from "../lib/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My Sites - Luna Sites" },
    { name: "description", content: "Manage your Luna Sites websites" },
  ];
}

export default function Sites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'domains'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      const sites = await api.getUserSites();
      if (sites && sites.length > 0) {
        setWebsites(sites.map((site: any, index: number) => ({
          id: site.id || index + 1,
          title: site.name || 'Untitled Website',
          url: site.domain || `${site.siteId}.lunaweb.app`,
          thumbnail: `/wizard-assets/cadb01d5f39257b9bed043b110f35314dd1c3305.png`, // Placeholder
          createdDate: new Date(site.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          lastEdited: 'Recently',
          expiryDate: 'Dec 26, 2025',
          status: site.status === 'active' ? 'Published' : 'Draft',
          views: '0',
          template: 'Custom'
        })));
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
      window.location.href = "/";
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCreateWebsite = () => {
    window.location.href = "/builder";
  };

  const handleGoHome = () => {
    window.location.href = "/";
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

  const filteredWebsites = websites.filter(site =>
    site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get user initials for avatar
  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={handleGoHome} className="cursor-pointer">
              <img src={Logo} alt="Luna Sites" className="h-10" />
            </button>

            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`pb-1 border-b-2 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Dashboard
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm cursor-pointer font-semibold">
                {userInitials}
              </div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => window.location.href = "/profile"}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-lg"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
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
      <div className="px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl text-slate-900 font-bold">My Websites</h1>

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
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-10"
            >
              Create New Website
            </Button>
          </div>
        </div>

        {/* Websites List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="text-slate-400 mb-4">Loading your websites...</div>
          </div>
        ) : filteredWebsites.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-slate-400 mb-4">No websites found</div>
            <Button onClick={handleCreateWebsite} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
              Create Your First Website
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredWebsites.map((site) => (
              <div
                key={site.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Left Column - Website Preview */}
                  <div className="p-6 flex flex-col">
                    <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-[16/10]">
                      <img
                        src={site.thumbnail}
                        alt={site.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Right Column - Website Details */}
                  <div className="p-6 border-l border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <h3 className="text-xl text-slate-900 mb-2 font-semibold">{site.title}</h3>
                          <a
                            href={`https://${site.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                          >
                            {site.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Three-dot menu */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === site.id ? null : site.id)}
                            className="p-1 hover:bg-slate-100 rounded"
                          >
                            <MoreVertical className="w-5 h-5 text-slate-400" />
                          </button>

                          {openMenuId === site.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                              <button
                                onClick={() => window.open(`https://${site.url}`, '_blank')}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open Website
                              </button>
                              <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Settings
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1 font-medium">Status</p>
                            <p className="text-sm text-slate-900">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                site.status === 'Published'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {site.status}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1 font-medium">Template</p>
                            <p className="text-sm text-slate-900">{site.template}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1 font-medium">Created</p>
                            <p className="text-sm text-slate-900">{site.createdDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1 font-medium">Last Edited</p>
                            <p className="text-sm text-slate-900">{site.lastEdited}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1 font-medium">Total Views</p>
                            <p className="text-sm text-slate-900">{site.views}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1 font-medium">Trial Expires</p>
                            <p className="text-sm text-slate-900">{site.expiryDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit Website Button */}
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white mt-6 px-4 py-2 text-sm w-[200px] mx-auto"
                    >
                      Edit Website
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}