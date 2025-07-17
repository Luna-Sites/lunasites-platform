import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserSite {
  id: string;
  userId: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: {
    theme: string;
    customCss?: string;
    analytics?: boolean;
    seo?: {
      title?: string;
      description?: string;
      keywords?: string;
    };
  };
}

export interface UserBilling {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  paymentMethods: {
    id: string;
    type: 'card';
    last4: string;
    brand: string;
    isDefault: boolean;
  }[];
  billingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SiteBilling {
  id: string;
  siteId: string;
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due';
  subscriptionId?: string;
  currentPeriodStart?: Timestamp;
  currentPeriodEnd?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BillingUsage {
  id: string;
  siteId: string;
  userId: string;
  month: string; // YYYY-MM format
  pageViews: number;
  storage: number; // in MB
  bandwidth: number; // in GB
  createdAt: Timestamp;
}

// Sites functions
export const createSite = async (siteData: Omit<UserSite, 'id' | 'createdAt' | 'updatedAt'>) => {
  const sitesRef = collection(db, 'sites');
  const docRef = doc(sitesRef);
  
  const newSite: UserSite = {
    ...siteData,
    id: docRef.id,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };
  
  await setDoc(docRef, newSite);
  return newSite;
};

export const getUserSites = async (userId: string): Promise<UserSite[]> => {
  const sitesRef = collection(db, 'sites');
  const q = query(sitesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserSite);
};

export const getSite = async (siteId: string): Promise<UserSite | null> => {
  const docRef = doc(db, 'sites', siteId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserSite;
  }
  return null;
};

export const updateSite = async (siteId: string, updates: Partial<UserSite>) => {
  const docRef = doc(db, 'sites', siteId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteSite = async (siteId: string) => {
  const docRef = doc(db, 'sites', siteId);
  await deleteDoc(docRef);
};

// User billing functions (payment methods, addresses)
export const createUserBilling = async (billingData: Omit<UserBilling, 'id' | 'createdAt' | 'updatedAt'>) => {
  const billingRef = collection(db, 'userBilling');
  const docRef = doc(billingRef);
  
  const newBilling: UserBilling = {
    ...billingData,
    id: docRef.id,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };
  
  await setDoc(docRef, newBilling);
  return newBilling;
};

export const getUserBilling = async (userId: string): Promise<UserBilling | null> => {
  const billingRef = collection(db, 'userBilling');
  const q = query(billingRef, where('userId', '==', userId));
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  return querySnapshot.docs[0].data() as UserBilling;
};

export const updateUserBilling = async (userId: string, updates: Partial<UserBilling>) => {
  const billingRef = collection(db, 'userBilling');
  const q = query(billingRef, where('userId', '==', userId));
  
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docRef = querySnapshot.docs[0].ref;
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }
};

// Site billing functions (subscriptions per site)
export const createSiteBilling = async (billingData: Omit<SiteBilling, 'id' | 'createdAt' | 'updatedAt'>) => {
  const billingRef = collection(db, 'siteBilling');
  const docRef = doc(billingRef);
  
  const newBilling: SiteBilling = {
    ...billingData,
    id: docRef.id,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };
  
  await setDoc(docRef, newBilling);
  return newBilling;
};

export const getSiteBilling = async (siteId: string): Promise<SiteBilling | null> => {
  const billingRef = collection(db, 'siteBilling');
  const q = query(billingRef, where('siteId', '==', siteId));
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  return querySnapshot.docs[0].data() as SiteBilling;
};

export const updateSiteBilling = async (siteId: string, updates: Partial<SiteBilling>) => {
  const billingRef = collection(db, 'siteBilling');
  const q = query(billingRef, where('siteId', '==', siteId));
  
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docRef = querySnapshot.docs[0].ref;
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }
};

// Usage tracking functions
export const recordUsage = async (usageData: Omit<BillingUsage, 'id' | 'createdAt'>) => {
  const usageRef = collection(db, 'usage');
  const docRef = doc(usageRef);
  
  const newUsage: BillingUsage = {
    ...usageData,
    id: docRef.id,
    createdAt: serverTimestamp() as Timestamp,
  };
  
  await setDoc(docRef, newUsage);
  return newUsage;
};

export const getSiteUsage = async (siteId: string, months: number = 12): Promise<BillingUsage[]> => {
  const usageRef = collection(db, 'usage');
  const q = query(usageRef, where('siteId', '==', siteId), orderBy('month', 'desc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.slice(0, months).map(doc => doc.data() as BillingUsage);
};

export const getUserUsage = async (userId: string, months: number = 12): Promise<BillingUsage[]> => {
  const usageRef = collection(db, 'usage');
  const q = query(usageRef, where('userId', '==', userId), orderBy('month', 'desc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.slice(0, months).map(doc => doc.data() as BillingUsage);
};