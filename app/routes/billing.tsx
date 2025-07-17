import React, { useState, useEffect } from 'react';
import type { Route } from "./+types/billing";
import { useAuth } from "../contexts/AuthContext";
import { AuthProvider } from "../contexts/AuthContext";
import { getUserBilling, createUserBilling, updateUserBilling } from "../lib/firestore";
import type { UserBilling } from "../lib/firestore";
import UserProfile from "../components/UserProfile";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Billing - Luna Sites" },
    { name: "description", content: "Manage your Luna Sites billing and subscription" },
  ];
}

export default function Billing() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<UserBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  });

  useEffect(() => {
    if (user) {
      loadBilling();
    }
  }, [user]);

  const loadBilling = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userBilling = await getUserBilling(user.uid);
      setBilling(userBilling);
      
      if (userBilling?.billingAddress) {
        setFormData(userBilling.billingAddress);
      }
    } catch (error) {
      console.error('Error loading billing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      if (billing) {
        await updateUserBilling(user.uid, {
          billingAddress: formData
        });
      } else {
        await createUserBilling({
          userId: user.uid,
          paymentMethods: [],
          billingAddress: formData
        });
      }
      
      await loadBilling();
      setEditing(false);
      alert('Billing information saved successfully!');
    } catch (error) {
      console.error('Error saving billing:', error);
      alert('Failed to save billing information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view billing</h1>
          <a href="/builder" className="bg-[#0052de] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
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
                <a href="/sites" className="text-gray-600 hover:text-[#0052de] transition-colors">
                  My Sites
                </a>
                <UserProfile />
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing Settings</h1>
          
          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
              <button className="bg-[#0052de] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Add Payment Method
              </button>
            </div>
            
            {billing?.paymentMethods.length === 0 || !billing ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">No payment methods added yet</div>
                <button className="bg-[#0052de] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Add Your First Payment Method
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {billing.paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-6 bg-gray-200 rounded mr-3"></div>
                      <div>
                        <p className="font-medium">{method.brand.toUpperCase()} •••• {method.last4}</p>
                        {method.isDefault && <span className="text-sm text-green-600">Default</span>}
                      </div>
                    </div>
                    <button className="text-red-600 hover:text-red-800">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Billing Address</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-[#0052de] hover:text-blue-700 font-medium"
                >
                  {billing?.billingAddress ? 'Edit' : 'Add'} Address
                </button>
              )}
            </div>
            
            {editing ? (
              <form onSubmit={handleSaveBilling} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052de] focus:border-transparent outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    value={formData.line1}
                    onChange={(e) => setFormData({...formData, line1: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052de] focus:border-transparent outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={formData.line2}
                    onChange={(e) => setFormData({...formData, line2: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052de] focus:border-transparent outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052de] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052de] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052de] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052de] focus:border-transparent outline-none"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#0052de] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : billing?.billingAddress ? (
              <div className="text-gray-900">
                <p className="font-medium">{billing.billingAddress.name}</p>
                <p>{billing.billingAddress.line1}</p>
                {billing.billingAddress.line2 && <p>{billing.billingAddress.line2}</p>}
                <p>{billing.billingAddress.city}, {billing.billingAddress.state} {billing.billingAddress.postalCode}</p>
                <p>{billing.billingAddress.country}</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">No billing address added yet</div>
                <button 
                  onClick={() => setEditing(true)}
                  className="bg-[#0052de] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Billing Address
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}