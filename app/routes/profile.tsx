import React, { useState } from 'react';
import type { Route } from "./+types/profile";
import { useAuth } from "../contexts/AuthContext";
import { Settings, LogOut, HelpCircle, Layout } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const Logo = '/logo/logo_lunasites_6.png';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Profile Settings - Luna Sites" },
    { name: "description", content: "Manage your Luna Sites profile settings" },
  ];
}

export default function Profile() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Please sign in to view profile</h1>
          <a href="/login" className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] text-white px-6 py-3 rounded-lg hover:from-[#4A2875] hover:to-[#C01AA3] transition-all">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 bg-slate-50"
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
            <h1 className="text-xl text-slate-500 font-medium mb-8">Profile Settings</h1>

            <div className="space-y-8">
            {/* Profile Information */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Profile Information</h2>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5A318F] focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white px-6 py-2.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>

            {/* Account Information */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Account Information</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">Account Created</p>
                    <p className="text-sm text-slate-500">
                      {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">Last Sign In</p>
                    <p className="text-sm text-slate-500">
                      {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="font-medium text-slate-900">Account Status</p>
                    <p className="text-sm text-green-600">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Security</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">Password</p>
                    <p className="text-sm text-slate-500">Change your password</p>
                  </div>
                  <button className="text-[#5A318F] hover:text-[#4A2875] font-medium text-sm">
                    Change Password
                  </button>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-500">Add an extra layer of security</p>
                  </div>
                  <button className="text-[#5A318F] hover:text-[#4A2875] font-medium text-sm">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white border border-red-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-6">Danger Zone</h2>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-red-900">Delete Account</p>
                  <p className="text-sm text-red-600">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                  Delete Account
                </button>
              </div>
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
