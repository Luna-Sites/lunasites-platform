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
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
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