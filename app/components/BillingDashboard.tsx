import React, { useState } from 'react';
import { useBilling } from '../contexts/BillingContext';

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['1 Site', '1GB Storage', '10K Monthly Views', 'Basic Support'],
    limits: { sites: 1, storage: 1024, pageViews: 10000 }
  },
  pro: {
    name: 'Pro',
    price: 29,
    features: ['5 Sites', '10GB Storage', '100K Monthly Views', 'Priority Support', 'Custom Domain'],
    limits: { sites: 5, storage: 10240, pageViews: 100000 }
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    features: ['Unlimited Sites', '100GB Storage', '1M Monthly Views', '24/7 Support', 'White Label'],
    limits: { sites: -1, storage: 102400, pageViews: 1000000 }
  }
};

export default function BillingDashboard() {
  const { billing, usage, loading, upgradePlan, cancelSubscription } = useBilling();
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise' | null>(null);

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    setUpgrading(true);
    setSelectedPlan(plan);
    
    try {
      await upgradePlan(plan);
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await cancelSubscription();
      } catch (error) {
        console.error('Cancellation failed:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052de]"></div>
      </div>
    );
  }

  const currentPlan = billing?.plan || 'free';
  const currentUsage = usage[0]; // Latest month's usage

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Current Plan Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Plan</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {PLANS[currentPlan].name}
            </h3>
            <p className="text-gray-600">
              ${PLANS[currentPlan].price}/month
            </p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                billing?.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {billing?.status || 'Active'}
              </span>
            </div>
          </div>
          
          {currentPlan !== 'free' && (
            <button
              onClick={handleCancel}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      {currentUsage && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Usage This Month</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0052de]">
                {currentUsage.sitesCount}
              </div>
              <div className="text-gray-600">Sites</div>
              <div className="text-sm text-gray-500">
                {PLANS[currentPlan].limits.sites === -1 ? 'Unlimited' : `of ${PLANS[currentPlan].limits.sites}`}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0052de]">
                {(currentUsage.pageViews / 1000).toFixed(1)}K
              </div>
              <div className="text-gray-600">Page Views</div>
              <div className="text-sm text-gray-500">
                of {(PLANS[currentPlan].limits.pageViews / 1000).toFixed(0)}K
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0052de]">
                {(currentUsage.storage / 1024).toFixed(1)}GB
              </div>
              <div className="text-gray-600">Storage</div>
              <div className="text-sm text-gray-500">
                of {(PLANS[currentPlan].limits.storage / 1024).toFixed(0)}GB
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plans */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upgrade Plan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(PLANS).map(([planKey, plan]) => (
            <div
              key={planKey}
              className={`border rounded-lg p-6 ${
                currentPlan === planKey
                  ? 'border-[#0052de] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">
                ${plan.price}
                <span className="text-base font-normal text-gray-600">/month</span>
              </div>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              {currentPlan === planKey ? (
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : planKey === 'free' ? (
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed"
                >
                  Downgrade Not Available
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(planKey as 'pro' | 'enterprise')}
                  disabled={upgrading}
                  className="w-full bg-[#0052de] text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {upgrading && selectedPlan === planKey ? 'Processing...' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Usage History */}
      {usage.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Usage History</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Month</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Sites</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Page Views</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Storage</th>
                </tr>
              </thead>
              <tbody>
                {usage.slice(0, 6).map((monthUsage, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">{monthUsage.month}</td>
                    <td className="py-3 px-4 text-gray-600">{monthUsage.sitesCount}</td>
                    <td className="py-3 px-4 text-gray-600">{monthUsage.pageViews.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600">{(monthUsage.storage / 1024).toFixed(1)}GB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}