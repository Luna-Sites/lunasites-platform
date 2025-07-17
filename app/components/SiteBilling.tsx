import React, { useState, useEffect } from 'react';
import { getSiteBilling, createSiteBilling, updateSiteBilling, getSiteUsage } from '../lib/firestore';
import type { SiteBilling as SiteBillingType, BillingUsage } from '../lib/firestore';

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['Basic Features', '1GB Storage', '10K Monthly Views'],
    limits: { storage: 1024, pageViews: 10000 }
  },
  pro: {
    name: 'Pro',
    price: 29,
    features: ['Advanced Features', '10GB Storage', '100K Monthly Views', 'Custom Domain'],
    limits: { storage: 10240, pageViews: 100000 }
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    features: ['All Features', '100GB Storage', '1M Monthly Views', 'Priority Support'],
    limits: { storage: 102400, pageViews: 1000000 }
  }
};

interface SiteBillingProps {
  siteId: string;
  userId: string;
  siteName: string;
}

export default function SiteBilling({ siteId, userId, siteName }: SiteBillingProps) {
  const [billing, setBilling] = useState<SiteBillingType | null>(null);
  const [usage, setUsage] = useState<BillingUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise' | null>(null);

  useEffect(() => {
    loadBilling();
  }, [siteId]);

  const loadBilling = async () => {
    setLoading(true);
    try {
      const [siteBilling, siteUsage] = await Promise.all([
        getSiteBilling(siteId),
        getSiteUsage(siteId, 6)
      ]);
      
      setBilling(siteBilling);
      setUsage(siteUsage);
      
      // Create billing record if it doesn't exist
      if (!siteBilling) {
        const newBilling = await createSiteBilling({
          siteId,
          userId,
          plan: 'free',
          status: 'active'
        });
        setBilling(newBilling);
      }
    } catch (error) {
      console.error('Error loading site billing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    setUpgrading(true);
    setSelectedPlan(plan);
    
    try {
      await updateSiteBilling(siteId, {
        plan,
        status: 'active'
      });
      
      await loadBilling();
      alert(`Successfully upgraded ${siteName} to ${plan}!`);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const handleCancel = async () => {
    if (window.confirm(`Are you sure you want to cancel the subscription for ${siteName}?`)) {
      try {
        await updateSiteBilling(siteId, {
          status: 'cancelled'
        });
        await loadBilling();
      } catch (error) {
        console.error('Error cancelling subscription:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052de]"></div>
      </div>
    );
  }

  const currentPlan = billing?.plan || 'free';
  const currentUsage = usage[0]; // Latest month's usage

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Current Plan for {siteName}
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              {PLANS[currentPlan].name}
            </h4>
            <p className="text-gray-600">
              ${PLANS[currentPlan].price}/month
            </p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
              billing?.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {billing?.status || 'Active'}
            </span>
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

      {/* Usage This Month */}
      {currentUsage && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage This Month</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#0052de]">
                {(currentUsage.pageViews / 1000).toFixed(1)}K
              </div>
              <div className="text-gray-600">Page Views</div>
              <div className="text-sm text-gray-500">
                of {(PLANS[currentPlan].limits.pageViews / 1000).toFixed(0)}K
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-[#0052de]">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(PLANS).map(([planKey, plan]) => (
            <div
              key={planKey}
              className={`border rounded-lg p-4 ${
                currentPlan === planKey
                  ? 'border-[#0052de] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {plan.name}
              </h4>
              <div className="text-2xl font-bold text-gray-900 mb-3">
                ${plan.price}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </div>
              
              <ul className="space-y-1 mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <svg className="w-3 h-3 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
}