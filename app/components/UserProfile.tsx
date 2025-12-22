import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setShowDropdown(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.email || 'User'}
            className="w-8 h-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 bg-[#0052de] rounded-full flex items-center justify-center text-white font-semibold">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <span className="text-gray-700">{user.email}</span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">
            Signed in as<br />
            <span className="font-medium text-gray-900 break-all">{user.email}</span>
          </div>
          
          <a
            href="/profile"
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors block"
          >
            Profile Settings
          </a>
          
          <a
            href="/sites"
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors block"
          >
            My Sites
          </a>
          
          <a
            href="/billing"
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors block"
          >
            Billing
          </a>
          
          <hr className="my-1" />
          
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}