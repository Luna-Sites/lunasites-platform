import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from './+types/templates';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Globe,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { api, type Template } from '../lib/api';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Templates - Luna Sites' },
    { name: 'description', content: 'Manage website templates' },
  ];
}

export default function Templates() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    siteId: '',
    name: '',
    description: '',
    isPublic: true,
  });
  const [creating, setCreating] = useState(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      loadTemplates();
      if (isAdmin) {
        loadSites();
      }
    }
  }, [user, isAdmin]);

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const data = await api.getUserSites();
      setSites(data);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const handleCreateTemplate = async () => {
    if (!createForm.siteId || !createForm.name) return;

    setCreating(true);
    try {
      await api.createTemplate(createForm);
      setShowCreateModal(false);
      setCreateForm({ siteId: '', name: '', description: '', isPublic: true });
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Make sure you have admin permissions.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.deleteTemplate(templateId);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template.');
    }
  };

  const handleTogglePublic = async (template: Template) => {
    try {
      await api.updateTemplate(template.id, { isPublic: !template.isPublic });
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/sites')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-semibold text-slate-900">Templates</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 h-10"
              />
            </div>

            {isAdmin && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white h-10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {!isAdmin && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              You can view available templates here. Only admins can create and manage templates.
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Globe className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No templates yet</p>
            <p className="text-sm text-slate-400 mt-1">
              {isAdmin
                ? 'Create a template from one of your sites'
                : 'Templates will appear here when available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Preview */}
                <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Globe className="w-12 h-12 text-purple-300" />
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{template.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        template.isPublic
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {template.isPublic ? (
                        <>
                          <Globe className="w-3 h-3" /> Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" /> Private
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {template.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      From: {template.sourceSiteId}
                    </span>
                    <span>
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Admin Actions */}
                  {template.isOwner && isAdmin && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublic(template)}
                        className="flex-1"
                      >
                        {template.isPublic ? (
                          <>
                            <Lock className="w-3 h-3 mr-1" /> Make Private
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3 mr-1" /> Make Public
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Create Template
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Source Site
                </label>
                <select
                  value={createForm.siteId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, siteId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a site...</option>
                  {sites.map((site) => (
                    <option key={site.siteId} value={site.siteId}>
                      {site.name} ({site.siteId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Template Name
                </label>
                <Input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="My Template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  placeholder="A brief description of this template..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={createForm.isPublic}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, isPublic: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="isPublic" className="text-sm text-slate-700">
                  Make this template public (visible to all users)
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                disabled={!createForm.siteId || !createForm.name || creating}
                className="flex-1 bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white"
              >
                {creating ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
