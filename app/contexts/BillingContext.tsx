import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getUserBilling, getUserUsage, createUserBilling, updateUserBilling } from '../lib/firestore';
import type { UserBilling, BillingUsage } from '../lib/firestore';

interface BillingContextType {
  billing: UserBilling | null;
  usage: BillingUsage[];
  loading: boolean;
  refreshBilling: () => Promise<void>;
  upgradePlan: (plan: 'pro' | 'enterprise') => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

interface BillingProviderProps {
  children: React.ReactNode;
}

export const BillingProvider = ({ children }: BillingProviderProps) => {
  const { user } = useAuth();
  const [billing, setBilling] = useState<UserBilling | null>(null);
  const [usage, setUsage] = useState<BillingUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBilling = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [billingData, usageData] = await Promise.all([
        getUserBilling(user.uid),
        getUserUsage(user.uid, 12)
      ]);
      
      setBilling(billingData);
      setUsage(usageData);
      
      // Create billing record if it doesn't exist
      if (!billingData) {
        const newBilling = await createUserBilling({
          userId: user.uid,
          plan: 'free',
          status: 'active'
        });
        setBilling(newBilling);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (plan: 'pro' | 'enterprise') => {
    if (!user || !billing) return;
    
    try {
      // Here you would integrate with Stripe for payment processing
      // For now, we'll just update the plan status
      await updateUserBilling(user.uid, {
        plan,
        status: 'active'
      });
      
      await refreshBilling();
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    if (!user || !billing) return;
    
    try {
      // Here you would integrate with Stripe to cancel subscription
      await updateUserBilling(user.uid, {
        status: 'cancelled'
      });
      
      await refreshBilling();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      refreshBilling();
    } else {
      setBilling(null);
      setUsage([]);
      setLoading(false);
    }
  }, [user]);

  const value = {
    billing,
    usage,
    loading,
    refreshBilling,
    upgradePlan,
    cancelSubscription
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
};