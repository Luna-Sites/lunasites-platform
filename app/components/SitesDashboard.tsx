import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api, type Site, handleApiError } from '../lib/api';

export default function SitesDashboard() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSites();
    }
  }, [user]);

  // Auto-refresh for deploying sites
  useEffect(() => {
    const hasDeploying = sites.some((s: Site) => s.status === 'pending' || s.status === 'deploying');
    if (hasDeploying) {
      const interval = setInterval(loadSites, 10000);
      return () => clearInterval(interval);
    }
  }, [sites]);

  const loadSites = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const userSites = await api.getUserSites();
      setSites(userSites);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!window.confirm('Are you sure you want to delete this site? This action cannot be undone.')) return;

    try {
      await api.deleteSite(siteId);
      await loadSites();
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      console.error('Error deleting site:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'deploying':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && sites.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052de]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Sites</h1>
        <a
          href="/builder"
          className="bg-[#0052de] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Create New Site
        </a>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {sites.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No sites created yet</div>
          <a
            href="/builder"
            className="bg-[#0052de] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Create Your First Site
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div key={site.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{site.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                  {site.status}
                </span>
              </div>

              <div className="text-gray-600 mb-4">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  {site.renderUrl ? (
                    <a href={site.renderUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {site.domain}
                    </a>
                  ) : (
                    <span>{site.domain}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Created: {formatDate(site.createdAt)}
                </div>
              </div>

              {(site.status === 'pending' || site.status === 'deploying') && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-blue-700">
                      {site.status === 'pending' ? 'Creating service...' : 'Deploying your site...'}
                    </span>
                  </div>
                </div>
              )}

              {site.status === 'error' && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-red-700">Deployment failed. Please try again or contact support.</span>
                </div>
              )}

              {site.status === 'suspended' && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">This site has been suspended.</span>
                </div>
              )}

              <div className="flex space-x-2">
                {site.status === 'active' && site.renderUrl && (
                  <a
                    href={site.renderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                  >
                    Visit Site
                  </a>
                )}

                <button
                  onClick={() => handleDeleteSite(site.siteId)}
                  disabled={site.status === 'deploying'}
                  className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
