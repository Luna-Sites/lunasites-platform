import admin from 'firebase-admin';

const db = admin.firestore();

export interface CustomDomainInfo {
  domain: string;
  status: 'pending' | 'verifying' | 'verified' | 'active' | 'error';
  addedAt: admin.firestore.Timestamp;
  verifiedAt?: admin.firestore.Timestamp;
  activatedAt?: admin.firestore.Timestamp;
  errorMessage?: string;
  // Cloudflare Custom Hostname ID
  cloudflareHostnameId?: string;
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
  // Custom domain
  customDomain?: CustomDomainInfo;
}

const sitesCollection = db.collection('sites');

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
  return doc.data() as Site;
}

export async function getSiteBySiteId(siteId: string): Promise<Site | null> {
  const snapshot = await sitesCollection
    .where('siteId', '==', siteId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as Site;
}

export async function getSitesByUserId(userId: string): Promise<Site[]> {
  const snapshot = await sitesCollection
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => doc.data() as Site);
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
// CUSTOM DOMAIN MANAGEMENT
// ============================================

/**
 * Set custom domain for a site (initial add)
 */
export async function setCustomDomain(id: string, domain: string, cloudflareHostnameId?: string): Promise<void> {
  const customDomain: CustomDomainInfo = {
    domain,
    status: 'pending',
    addedAt: admin.firestore.Timestamp.now(),
    cloudflareHostnameId,
  };

  await updateSite(id, { customDomain });
}

/**
 * Update custom domain status
 */
export async function updateCustomDomainStatus(
  id: string,
  status: CustomDomainInfo['status'],
  errorMessage?: string
): Promise<void> {
  const site = await getSiteById(id);
  if (!site || !site.customDomain) return;

  const updates: Partial<CustomDomainInfo> = { status };

  if (status === 'verified') {
    updates.verifiedAt = admin.firestore.Timestamp.now();
  } else if (status === 'active') {
    updates.activatedAt = admin.firestore.Timestamp.now();
  } else if (status === 'error' && errorMessage) {
    updates.errorMessage = errorMessage;
  }

  await sitesCollection.doc(id).update({
    'customDomain.status': status,
    ...(updates.verifiedAt && { 'customDomain.verifiedAt': updates.verifiedAt }),
    ...(updates.activatedAt && { 'customDomain.activatedAt': updates.activatedAt }),
    ...(updates.errorMessage && { 'customDomain.errorMessage': updates.errorMessage }),
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

/**
 * Remove custom domain from a site
 */
export async function removeCustomDomain(id: string): Promise<void> {
  await sitesCollection.doc(id).update({
    customDomain: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.Timestamp.now(),
  });
}
