import admin from 'firebase-admin';

const db = admin.firestore();

export interface CustomDomainInfo {
  domain: string;
  status: 'pending' | 'verifying' | 'verified' | 'active' | 'error';
  addedAt: admin.firestore.Timestamp;
  verifiedAt?: admin.firestore.Timestamp;
  activatedAt?: admin.firestore.Timestamp;
  errorMessage?: string;
}

export interface Site {
  id: string;
  siteId: string;
  userId: string;
  name: string;
  domain: string;
  status: 'pending' | 'deploying' | 'active' | 'error' | 'suspended';
  renderServiceId?: string;
  renderUrl?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  // Multiple custom domains
  customDomains?: CustomDomainInfo[];
  // Legacy single domain (kept for backward compatibility)
  customDomain?: CustomDomainInfo;
}

const sitesCollection = db.collection('sites');

// Helper to migrate legacy single domain to array
function migrateLegacyDomain(site: Site): Site {
  if (site.customDomain && !site.customDomains) {
    site.customDomains = [site.customDomain];
  }
  return site;
}

export async function createSite(data: {
  siteId: string;
  userId: string;
  name: string;
  domain: string;
}): Promise<Site> {
  const docRef = sitesCollection.doc();
  const now = admin.firestore.Timestamp.now();

  const site: Site = {
    id: docRef.id,
    siteId: data.siteId,
    userId: data.userId,
    name: data.name,
    domain: data.domain,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(site);
  return site;
}

export async function getSiteById(id: string): Promise<Site | null> {
  const doc = await sitesCollection.doc(id).get();
  if (!doc.exists) return null;
  return migrateLegacyDomain(doc.data() as Site);
}

export async function getSiteBySiteId(siteId: string): Promise<Site | null> {
  const snapshot = await sitesCollection
    .where('siteId', '==', siteId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return migrateLegacyDomain(snapshot.docs[0].data() as Site);
}

export async function getSitesByUserId(userId: string): Promise<Site[]> {
  const snapshot = await sitesCollection
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => migrateLegacyDomain(doc.data() as Site));
}

export async function updateSite(id: string, data: Partial<Site>): Promise<void> {
  await sitesCollection.doc(id).update({
    ...data,
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

export async function updateSiteRenderInfo(
  id: string,
  renderServiceId: string,
  renderUrl: string
): Promise<void> {
  await updateSite(id, {
    renderServiceId,
    renderUrl,
    status: 'deploying',
  });
}

export async function setSiteActive(id: string): Promise<void> {
  await updateSite(id, { status: 'active' });
}

export async function setSiteError(id: string): Promise<void> {
  await updateSite(id, { status: 'error' });
}

export async function deleteSite(id: string): Promise<void> {
  await sitesCollection.doc(id).delete();
}

export async function checkSiteAvailability(siteId: string): Promise<boolean> {
  const site = await getSiteBySiteId(siteId);
  return site === null;
}

// ============================================
// CUSTOM DOMAIN MANAGEMENT (Multiple domains)
// ============================================

/**
 * Add a custom domain to a site
 */
export async function addCustomDomain(id: string, domain: string): Promise<void> {
  const site = await getSiteById(id);
  if (!site) throw new Error('Site not found');

  const customDomains = site.customDomains || [];

  // Check if domain already exists
  if (customDomains.some(d => d.domain === domain)) {
    throw new Error('Domain already added to this site');
  }

  const newDomain: CustomDomainInfo = {
    domain,
    status: 'pending',
    addedAt: admin.firestore.Timestamp.now(),
  };

  customDomains.push(newDomain);

  await sitesCollection.doc(id).update({
    customDomains,
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

/**
 * Get all custom domains for a site
 */
export async function getCustomDomains(id: string): Promise<CustomDomainInfo[]> {
  const site = await getSiteById(id);
  if (!site) return [];
  return site.customDomains || [];
}

/**
 * Get a specific custom domain for a site
 */
export async function getCustomDomain(id: string, domain: string): Promise<CustomDomainInfo | null> {
  const domains = await getCustomDomains(id);
  return domains.find(d => d.domain === domain) || null;
}

/**
 * Update custom domain status (for a specific domain)
 */
export async function updateCustomDomainStatus(
  id: string,
  domain: string,
  status: CustomDomainInfo['status'],
  errorMessage?: string
): Promise<void> {
  const site = await getSiteById(id);
  if (!site) return;

  const customDomains = site.customDomains || [];
  const domainIndex = customDomains.findIndex(d => d.domain === domain);
  if (domainIndex === -1) return;

  // Update the domain in the array
  customDomains[domainIndex].status = status;

  if (status === 'verified') {
    customDomains[domainIndex].verifiedAt = admin.firestore.Timestamp.now();
  } else if (status === 'active') {
    customDomains[domainIndex].activatedAt = admin.firestore.Timestamp.now();
  } else if (status === 'error' && errorMessage) {
    customDomains[domainIndex].errorMessage = errorMessage;
  }

  await sitesCollection.doc(id).update({
    customDomains,
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

/**
 * Remove a specific custom domain from a site
 */
export async function removeCustomDomain(id: string, domain: string): Promise<void> {
  const site = await getSiteById(id);
  if (!site) return;

  const customDomains = (site.customDomains || []).filter(d => d.domain !== domain);

  await sitesCollection.doc(id).update({
    customDomains,
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

// Legacy function for backward compatibility
export async function setCustomDomain(id: string, domain: string): Promise<void> {
  return addCustomDomain(id, domain);
}
