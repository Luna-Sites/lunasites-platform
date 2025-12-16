import { useState } from 'react';
import { Search, Grid3x3, LayoutGrid, MoreVertical, ExternalLink, Settings, LogOut, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import logo from 'figma:asset/1e2df6b5a066341b6419d0cf910c5e86038504d4.png';
import portfolioImg from 'figma:asset/cadb01d5f39257b9bed043b110f35314dd1c3305.png';
import restaurantImg from 'figma:asset/b23bd12188c3ef947fd6b1b0bbe43fd80fbfc342.png';
import shopImg from 'figma:asset/71307606acb6787b5e76de625a8ec65231dd9256.png';
import blogImg from 'figma:asset/041cf6f3cefd4852af7111701a69ab2fdd52620e.png';
import eventImg from 'figma:asset/76d3c409747ba05034bcb396ba101e021e656b6e.png';
import img6 from 'figma:asset/f2b6ee8458f1f24edd1158a6df9bdc487e1e99a2.png';

interface DashboardProps {
  onCreateWebsite: () => void;
  onLogout: () => void;
  onGoHome: () => void;
}

export default function Dashboard({ onCreateWebsite, onLogout, onGoHome }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'domains'>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Mock user websites data
  const websites = [
    {
      id: 1,
      title: 'Best Design Ever',
      url: 'https://daniels-a856.lunasites.com',
      thumbnail: portfolioImg,
      createdDate: 'Nov 15, 2024',
      lastEdited: '2 days ago',
      expiryDate: 'Dec 26, 2025',
      status: 'Published',
      views: '1,234',
      template: 'Portfolio Pro'
    },
    {
      id: 2,
      title: 'Start your website',
      url: 'dbesign-armadflo-23jd2.lunasites.com',
      thumbnail: img6,
      createdDate: 'Nov 20, 2024',
      lastEdited: '5 days ago',
      expiryDate: 'Dec 21, 2025',
      status: 'Draft',
      views: '45',
      template: 'Business Starter'
    },
    {
      id: 3,
      title: 'Best Design Ever',
      url: 'bear-carillon-h4k4.lunasites.com',
      thumbnail: restaurantImg,
      createdDate: 'Oct 28, 2024',
      lastEdited: '1 week ago',
      expiryDate: 'Dec 17, 2025',
      status: 'Published',
      views: '892',
      template: 'Restaurant Classic'
    },
    {
      id: 4,
      title: 'Start your website',
      url: 'design-armadflo-pkkf4.lunasites.com',
      thumbnail: shopImg,
      createdDate: 'Oct 10, 2024',
      lastEdited: '3 weeks ago',
      expiryDate: 'Dec 15, 2025',
      status: 'Draft',
      views: '23',
      template: 'Shop Modern'
    }
  ];

  const filteredWebsites = websites.filter(site => 
    site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={onGoHome} className="cursor-pointer">
              <img src={logo} alt="Lunasites" className="h-10" />
            </button>
            
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`pb-1 border-b-2 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Dashboard
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm cursor-pointer">
                JD
              </div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
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
                  onClick={onLogout}
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
          <h1 className="text-3xl text-slate-900">My Websites</h1>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Create Website Button */}
            <Button
              onClick={onCreateWebsite}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              Create New Website
            </Button>
          </div>
        </div>

        {/* Websites Grid/List */}
        {filteredWebsites.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-slate-400 mb-4">No websites found</div>
            <Button onClick={onCreateWebsite}>Create Your First Website</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredWebsites.map((site) => (
              <div
                key={site.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Left Column - Website Preview & Edit Button */}
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
                          <h3 className="text-xl text-slate-900 mb-2">{site.title}</h3>
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
                              <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
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
                            <p className="text-xs text-slate-500 mb-1">Status</p>
                            <p className="text-sm text-slate-900">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                site.status === 'Published' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {site.status}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Template</p>
                            <p className="text-sm text-slate-900">{site.template}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Created</p>
                            <p className="text-sm text-slate-900">{site.createdDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Last Edited</p>
                            <p className="text-sm text-slate-900">{site.lastEdited}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Total Views</p>
                            <p className="text-sm text-slate-900">{site.views}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Trial Expires</p>
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