import { auth } from './firebase';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Public template type (for builder - no auth required)
export interface PublicTemplate {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  sourceSiteId: string;
  isPublic: boolean;
  createdAt: string;
}

// Fetch public templates (no auth required)
export async function getPublicTemplates(): Promise<PublicTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/templates/public`);
  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }
  return response.json();
}

// User info type
export interface UserInfo {
  uid: string;
  email: string;
  role: string | null;
}

// Types
export interface Site {
  id: string;
  siteId: string;
  userId: string;
  name: string;
  domain: string;
  status: 'pending' | 'deploying' | 'active' | 'error' | 'suspended';
  renderUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteCreateRequest {
  site_id: string;
  name: string;
  template_id?: string;
}

export interface SiteAvailabilityResponse {
  site_id: string;
  available: boolean;
  domain?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  site?: T;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  sourceSiteId: string;
  userId: string;
  isPublic: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCreateRequest {
  siteId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

// Get Firebase Auth Token
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();
  return token;
}

// API Request Helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// API Functions
export const api = {
  // Get current user info (including role)
  async getMe(): Promise<UserInfo> {
    return apiRequest<UserInfo>('/me');
  },

  // Check site ID availability
  async checkSiteAvailability(siteId: string): Promise<SiteAvailabilityResponse> {
    return apiRequest<SiteAvailabilityResponse>(`/sites/check-availability/${siteId}`, {
      method: 'POST',
    });
  },
  
  // Create a new site
  async createSite(siteData: SiteCreateRequest): Promise<ApiResponse<Site>> {
    return apiRequest<ApiResponse<Site>>('/sites/', {
      method: 'POST',
      body: JSON.stringify(siteData),
    });
  },
  
  // Get all user sites
  async getUserSites(): Promise<Site[]> {
    return apiRequest<Site[]>('/sites/');
  },
  
  // Get a specific site
  async getSite(siteId: string): Promise<Site> {
    return apiRequest<Site>(`/sites/${siteId}`);
  },
  
  // Delete a site
  async deleteSite(siteId: string): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>(`/sites/${siteId}`, {
      method: 'DELETE',
    });
  },

  // Update site theme
  async updateSiteTheme(siteId: string, theme: {
    presetId: string;
    overrides: Record<string, string>;
    darkMode?: boolean;
    typography?: {
      fontPresetId?: string;
      fontHeading?: string;
      fontBody?: string;
      baseFontSize?: number;
      baseFontSizeMobile?: number;
      headingWeight?: number;
      bodyWeight?: number;
    };
  }): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>(`/sites/${siteId}/theme`, {
      method: 'PATCH',
      body: JSON.stringify(theme),
    });
  },

  // Touch site (update updatedAt timestamp)
  async touchSite(siteId: string): Promise<{ success: boolean }> {
    return apiRequest(`/sites/${siteId}/touch`, {
      method: 'POST',
    });
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return apiRequest<{ status: string }>('/health');
  },

  // ============================================
  // TEMPLATES
  // ============================================

  // Get all templates
  async getTemplates(): Promise<Template[]> {
    return apiRequest<Template[]>('/templates/');
  },

  // Get a specific template
  async getTemplate(templateId: string): Promise<Template> {
    return apiRequest<Template>(`/templates/${templateId}`);
  },

  // Create template from site (admin only)
  async createTemplate(data: TemplateCreateRequest): Promise<ApiResponse<Template>> {
    return apiRequest<ApiResponse<Template>>('/templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update template (admin only)
  async updateTemplate(templateId: string, data: Partial<TemplateCreateRequest>): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>(`/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete template (admin only)
  async deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>(`/templates/${templateId}`, {
      method: 'DELETE',
    });
  },

  // ============================================
  // CUSTOM DOMAINS
  // ============================================

  // Add custom domain to site
  async addCustomDomain(siteId: string, domain: string, autoConfigureDns?: boolean): Promise<{
    success: boolean;
    domain: string;
    status: string;
    sslStatus: string;
    dnsInstructions: {
      records: Array<{
        type: string;
        host: string;
        value: string;
        description?: string;
      }>;
      cnameTarget: string;
      flyIpv4: string;
      flyIpv6?: string;
      note?: string;
    };
  }> {
    return apiRequest(`/sites/${siteId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ domain, autoConfigureDns }),
    });
  },

  // Get custom domains status (returns array)
  async getCustomDomains(siteId: string): Promise<{
    customDomains: Array<{
      domain: string;
      status: 'pending' | 'verifying' | 'verified' | 'active' | 'error';
      verificationStatus: 'unverified' | 'verified';
      certificateStatus: 'pending' | 'issued' | 'error';
      sslStatus?: string;
      addedAt: string;
      verifiedAt?: string;
      activatedAt?: string;
      errorMessage?: string;
    }>;
    dnsInstructions?: {
      records: Array<{
        type: string;
        host: string;
        value: string;
        description?: string;
      }>;
      cnameTarget: string;
      flyIpv4: string;
      flyIpv6?: string;
      note?: string;
    };
  }> {
    return apiRequest(`/sites/${siteId}/domains`);
  },

  // Verify DNS configuration for a specific domain
  async verifyCustomDomain(siteId: string, domain?: string): Promise<{
    verified: boolean;
    domain: string;
    steps: {
      domainAssigned: boolean;
      dnsConfigured: boolean;
    };
    sslStatus: string;
    message: string;
  }> {
    return apiRequest(`/sites/${siteId}/domains/verify`, {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  },

  // Activate custom domain
  async activateCustomDomain(siteId: string, domain?: string): Promise<{
    success: boolean;
    message: string;
    domain: string;
  }> {
    return apiRequest(`/sites/${siteId}/domains/activate`, {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  },

  // Remove specific custom domain
  async removeCustomDomain(siteId: string, domain: string): Promise<{
    success: boolean;
    message: string;
    domain: string;
  }> {
    return apiRequest(`/sites/${siteId}/domains/${encodeURIComponent(domain)}`, {
      method: 'DELETE',
    });
  },

  // ============================================
  // DOMAIN REGISTRATION (Namecheap)
  // ============================================

  // Check domain availability (no auth required)
  async checkDomainAvailability(domain: string): Promise<{
    domain: string;
    available: boolean;
    premium: boolean;
    premiumPrice?: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/domains/check?domain=${encodeURIComponent(domain)}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to check domain');
    }
    return response.json();
  },

  // Check multiple domains at once (no auth required)
  async checkDomainsAvailability(domains: string[]): Promise<{
    domains: Array<{
      domain: string;
      available: boolean;
      premium: boolean;
      premiumPrice?: number;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/domains/check-bulk?domains=${encodeURIComponent(domains.join(','))}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to check domains');
    }
    return response.json();
  },

  // Get domain suggestions based on keyword (no auth required)
  async getDomainSuggestions(keyword: string): Promise<{
    suggestions: Array<{
      domain: string;
      available: boolean;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/domains/suggest?keyword=${encodeURIComponent(keyword)}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to get suggestions');
    }
    return response.json();
  },

  // Get TLD pricing (no auth required)
  async getDomainPricing(): Promise<{
    tlds: Array<{
      tld: string;
      registerPrice: number;
      renewPrice: number;
      transferPrice: number;
      currency: string;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/domains/pricing`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to get pricing');
    }
    return response.json();
  },

  // Purchase a domain (requires auth)
  async purchaseDomain(data: {
    domain: string;
    years: number;
    contact: {
      firstName: string;
      lastName: string;
      address1: string;
      city: string;
      stateProvince: string;
      postalCode: string;
      country: string;
      phone: string;
      email: string;
      organization?: string;
    };
  }): Promise<{
    success: boolean;
    domain: string;
    orderId?: string;
    transactionId?: string;
    chargedAmount?: number;
  }> {
    return apiRequest('/domains/purchase', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Configure DNS for a domain (requires auth)
  async configureDomainDns(domain: string, records: Array<{
    type: string;
    host: string;
    value: string;
    ttl?: number;
  }>): Promise<{ success: boolean; domain: string }> {
    return apiRequest(`/domains/${encodeURIComponent(domain)}/dns`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  // Get domain service status (requires auth)
  async getDomainServiceStatus(): Promise<{
    configured: boolean;
    balance?: number;
    currency?: string;
    message?: string;
  }> {
    return apiRequest('/domains/status');
  },

  // ============================================
  // BILLING & SUBSCRIPTIONS
  // ============================================

  // Get available subscription plans (no auth required)
  async getPlans(): Promise<{
    trial: {
      days: number;
      description: string;
      customDomain: boolean;
    };
    plans: Array<{
      id: string;
      name: string;
      price: number;
      pricePerMonth?: number;
      currency: string;
      interval: string;
      intervalCount: number;
      description: string;
      savings?: string;
      customDomain: boolean;
      features: string[];
    }>;
    storage: {
      free: number;
      pricePerUnit: number;
      unitSize: number;
      currency: string;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/billing/plans`);
    if (!response.ok) throw new Error('Failed to fetch plans');
    return response.json();
  },

  // Create subscription checkout session
  async createSubscriptionCheckout(data: {
    siteId: string;
    plan: 'starter' | 'monthly' | 'annual' | 'biennial';
    successUrl?: string;
    cancelUrl?: string;
    withTrial?: boolean;
  }): Promise<{
    sessionId: string;
    url: string;
  }> {
    return apiRequest('/billing/checkout/subscription', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Create domain purchase checkout session
  async createDomainCheckout(data: {
    domain: string;
    years: number;
    priceEur: number; // Price in EUR (already includes markup)
    contact: {
      firstName: string;
      lastName: string;
      address1: string;
      city: string;
      stateProvince: string;
      postalCode: string;
      country: string;
      phone: string;
      email: string;
    };
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{
    sessionId: string;
    url: string;
    finalPriceEur: number;
  }> {
    return apiRequest('/billing/checkout/domain', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get customer portal URL for managing subscriptions
  async getBillingPortalUrl(returnUrl?: string): Promise<{ url: string }> {
    const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    return apiRequest(`/billing/portal${params}`);
  },

  // Get all subscriptions for the current user
  async getSubscriptions(): Promise<{
    subscriptions: Array<{
      id: string;
      siteId: string;
      plan: 'free' | 'starter' | 'pro';
      status: 'active' | 'cancelled' | 'past_due' | 'trialing';
      subscriptionId?: string;
      currentPeriodStart?: string;
      currentPeriodEnd?: string;
      trialEnd?: string;
    }>;
  }> {
    return apiRequest('/billing/subscriptions');
  },

  // Cancel subscription for a site
  async cancelSubscription(siteId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/billing/cancel/${siteId}`, {
      method: 'POST',
    });
  },

  // Change subscription plan for a site
  async changeSubscriptionPlan(
    siteId: string,
    plan: 'starter' | 'monthly' | 'annual' | 'biennial'
  ): Promise<{ success: boolean; message: string; plan: string }> {
    return apiRequest(`/billing/change-plan/${siteId}`, {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },

  // Get storage usage for a site
  async getUsage(siteId: string): Promise<{
    usage: Array<{
      month: string;
      storage: number;
      pageViews: number;
      bandwidth: number;
    }>;
    currentStorage: number;
    freeStorageMb: number;
    billableStorageMb: number;
    estimatedCharge: number;
    currency: string;
  }> {
    return apiRequest(`/billing/usage/${siteId}`);
  },

  // Get billing status for current user
  async getBillingStatus(): Promise<{
    hasStripeAccount: boolean;
    paymentMethods: Array<{
      id: string;
      type: string;
      last4: string;
      brand: string;
      isDefault: boolean;
    }>;
    billingAddress: {
      name: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    } | null;
  }> {
    return apiRequest('/billing/status');
  },
};

// Error handling helper
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Site ID validation
export function validateSiteId(siteId: string): string | null {
  if (!siteId || siteId.length < 3) {
    return 'Site ID must be at least 3 characters long';
  }
  
  if (siteId.length > 50) {
    return 'Site ID must be less than 50 characters';
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(siteId)) {
    return 'Site ID can only contain letters and numbers';
  }
  
  return null;
}

// Site name validation
export function validateSiteName(name: string): string | null {
  if (!name || name.trim().length < 3) {
    return 'Site name must be at least 3 characters long';
  }
  
  if (name.trim().length > 100) {
    return 'Site name must be less than 100 characters';
  }
  
  return null;
}

export default api;