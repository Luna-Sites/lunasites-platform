import type { Route } from "./+types/sites";
import { useAuth } from "../contexts/AuthContext";
import { AuthProvider } from "../contexts/AuthContext";
import { BillingProvider } from "../contexts/BillingContext";
import SitesDashboard from "../components/SitesDashboard";
import UserProfile from "../components/UserProfile";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My Sites - Luna Sites" },
    { name: "description", content: "Manage your Luna Sites websites" },
  ];
}

export default function Sites() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view your sites</h1>
          <a href="/builder" className="bg-[#0052de] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BillingProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <a href="/" className="text-2xl font-bold text-[#0052de]">Luna Sites</a>
                </div>
                <div className="flex items-center gap-4">
                  <a href="/builder" className="text-gray-600 hover:text-[#0052de] transition-colors">
                    Create Site
                  </a>
                  <UserProfile />
                </div>
              </div>
            </div>
          </nav>

          <SitesDashboard />
        </div>
      </BillingProvider>
    </AuthProvider>
  );
}