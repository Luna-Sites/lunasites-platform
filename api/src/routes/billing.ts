/**
 * Billing Routes
 * API endpoints for Stripe subscriptions, domain payments, and usage tracking
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import * as stripeService from '../services/stripe.js';
import * as namecheap from '../services/namecheap.js';
import admin from 'firebase-admin';
import { config } from '../config/index.js';

const router = Router();

// ============================================
// PUBLIC ENDPOINTS (no auth required)
// ============================================

/**
 * GET /billing/plans
 * Get available subscription plans
 */
router.get('/plans', async (req, res) => {
  return res.json({
    trial: {
      days: 29,
      description: 'Free trial with luna-sites.com subdomain',
      customDomain: false,
    },
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        price: 4.99,
        currency: 'EUR',
        interval: 'month',
        intervalCount: 1,
        description: 'Basic hosting with luna-sites.com subdomain',
        customDomain: false,
        features: ['luna-sites.com subdomain', '250MB storage', 'SSL included'],
      },
      {
        id: 'monthly',
        name: 'Pro Monthly',
        price: 13.0,
        currency: 'EUR',
        interval: 'month',
        intervalCount: 1,
        description: 'Full features with custom domain',
        customDomain: true,
        features: ['Custom domain', '250MB storage', 'SSL included', 'Priority support'],
      },
      {
        id: 'annual',
        name: 'Pro Annual',
        price: 119.88,
        pricePerMonth: 9.99,
        currency: 'EUR',
        interval: 'year',
        intervalCount: 1,
        description: 'Billed yearly (save 23%)',
        savings: '23%',
        customDomain: true,
        features: ['Custom domain', '250MB storage', 'SSL included', 'Priority support'],
      },
      {
        id: 'biennial',
        name: 'Pro 2 Years',
        price: 167.76,
        pricePerMonth: 6.99,
        currency: 'EUR',
        interval: 'year',
        intervalCount: 2,
        description: 'Billed every 2 years (save 46%)',
        savings: '46%',
        customDomain: true,
        features: ['Custom domain', '250MB storage', 'SSL included', 'Priority support'],
      },
    ],
    storage: {
      free: 250, // MB
      pricePerUnit: 1.0,
      unitSize: 500, // MB
      currency: 'EUR',
    },
  });
});

// ============================================
// SUBSCRIPTION ENDPOINTS (auth required)
// ============================================

/**
 * POST /billing/checkout/subscription
 * Create a Stripe Checkout session for site subscription
 */
router.post(
  '/checkout/subscription',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { siteId, plan, successUrl, cancelUrl, withTrial } = req.body;
      const userId = req.user!.uid;
      const email = req.user!.email || '';

      if (!siteId || !plan) {
        return res.status(400).json({ error: 'siteId and plan are required' });
      }

      if (!['starter', 'monthly', 'annual', 'biennial'].includes(plan)) {
        return res
          .status(400)
          .json({ error: 'Invalid plan. Must be starter, monthly, annual, or biennial' });
      }

      if (!stripeService.isConfigured()) {
        return res.status(503).json({ error: 'Payment service not configured' });
      }

      const origin = req.headers.origin || 'http://localhost:5173';

      const session = await stripeService.createSubscriptionCheckout({
        userId,
        email,
        siteId,
        plan,
        successUrl: successUrl || `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: cancelUrl || `${origin}/billing`,
        withTrial: withTrial === true,
      });

      console.log(`[Billing] Subscription checkout created for site ${siteId}, plan ${plan}, trial: ${withTrial}`);

      return res.json({
        sessionId: session.sessionId,
        url: session.url,
      });
    } catch (error) {
      console.error('Subscription checkout error:', error);
      return res.status(500).json({
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /billing/checkout/domain
 * Create a Stripe Checkout session for domain purchase
 */
router.post(
  '/checkout/domain',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { domain, years, priceEur, contact, successUrl, cancelUrl } = req.body;
      const userId = req.user!.uid;
      const email = req.user!.email || '';

      if (!domain || !years) {
        return res.status(400).json({ error: 'domain and years are required' });
      }

      if (!priceEur || priceEur <= 0) {
        return res.status(400).json({ error: 'priceEur is required and must be positive' });
      }

      if (years < 1 || years > 10) {
        return res.status(400).json({ error: 'Years must be between 1 and 10' });
      }

      if (!contact) {
        return res.status(400).json({ error: 'Contact information is required for domain registration' });
      }

      if (!stripeService.isConfigured()) {
        return res.status(503).json({ error: 'Payment service not configured' });
      }

      const origin = req.headers.origin || 'http://localhost:5173';

      const session = await stripeService.createDomainCheckoutWithPrice({
        userId,
        email,
        domain,
        years,
        priceEur,
        contact,
        successUrl:
          successUrl || `${origin}/domains/success?domain=${encodeURIComponent(domain)}`,
        cancelUrl: cancelUrl || `${origin}/domains`,
      });

      console.log(`[Billing] Domain checkout created for ${domain}, ${years} years, price: €${priceEur}`);

      return res.json({
        sessionId: session.sessionId,
        url: session.url,
        finalPriceEur: session.finalPriceEur,
      });
    } catch (error) {
      console.error('Domain checkout error:', error);
      return res.status(500).json({
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /billing/portal
 * Get Stripe Customer Portal URL for managing subscriptions
 */
router.get('/portal', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const origin = req.headers.origin || 'http://localhost:5173';
    const returnUrl = (req.query.returnUrl as string) || `${origin}/billing`;

    // Get customer ID from Firestore
    const db = admin.firestore();
    const userBillingDoc = await db
      .collection('userBilling')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (userBillingDoc.empty || !userBillingDoc.docs[0].data().stripeCustomerId) {
      return res.status(404).json({ error: 'No billing account found' });
    }

    const customerId = userBillingDoc.docs[0].data().stripeCustomerId;
    const portalUrl = await stripeService.createCustomerPortalSession(customerId, returnUrl);

    return res.json({ url: portalUrl });
  } catch (error) {
    console.error('Customer portal error:', error);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
});

/**
 * POST /billing/cancel/:siteId
 * Cancel subscription for a site
 */
router.post('/cancel/:siteId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId } = req.params;
    const userId = req.user!.uid;

    const db = admin.firestore();
    const siteBillingDoc = await db
      .collection('siteBilling')
      .where('siteId', '==', siteId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (siteBillingDoc.empty) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const subscriptionId = siteBillingDoc.docs[0].data().subscriptionId;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    await stripeService.cancelSubscription(subscriptionId);

    // Update Firestore
    await siteBillingDoc.docs[0].ref.update({
      status: 'cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Billing] Subscription cancelled for site ${siteId}`);

    return res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * POST /billing/change-plan/:siteId
 * Change subscription plan for a site
 */
router.post('/change-plan/:siteId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId } = req.params;
    const { plan } = req.body;
    const userId = req.user!.uid;

    if (!plan || !['starter', 'monthly', 'annual', 'biennial'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Must be starter, monthly, annual, or biennial' });
    }

    const db = admin.firestore();
    const siteBillingDoc = await db
      .collection('siteBilling')
      .where('siteId', '==', siteId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (siteBillingDoc.empty) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const billingData = siteBillingDoc.docs[0].data();
    const subscriptionId = billingData.subscriptionId;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription to change' });
    }

    // Update subscription in Stripe
    await stripeService.updateSubscriptionPlan(subscriptionId, plan);

    // Determine new plan type for Firestore
    const newPlanType = plan === 'starter' ? 'starter' : 'pro';

    // Update Firestore
    await siteBillingDoc.docs[0].ref.update({
      plan: newPlanType,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[Billing] Subscription plan changed for site ${siteId} to ${plan} (${newPlanType})`);

    return res.json({ success: true, message: 'Subscription plan changed', plan: newPlanType });
  } catch (error) {
    console.error('Change subscription plan error:', error);
    return res.status(500).json({ error: 'Failed to change subscription plan' });
  }
});

/**
 * GET /billing/subscriptions
 * Get all subscriptions for the current user
 */
router.get('/subscriptions', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    console.log(`[Billing] Getting subscriptions for user: ${userId}`);

    const db = admin.firestore();
    const siteBillingDocs = await db.collection('siteBilling').where('userId', '==', userId).get();

    console.log(`[Billing] Found ${siteBillingDocs.docs.length} siteBilling documents`);

    const subscriptions = siteBillingDocs.docs.map((doc) => {
      const data = doc.data();
      console.log(`[Billing] Processing doc ${doc.id}:`, JSON.stringify({
        siteId: data.siteId,
        plan: data.plan,
        status: data.status,
      }));

      return {
        id: doc.id,
        ...data,
        currentPeriodStart: data.currentPeriodStart?.toDate?.()?.toISOString() || null,
        currentPeriodEnd: data.currentPeriodEnd?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    console.log(`[Billing] Returning subscriptions:`, JSON.stringify(subscriptions, null, 2));
    return res.json({ subscriptions });
  } catch (error) {
    console.error('[Billing] Get subscriptions error:', error);
    return res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

/**
 * GET /billing/usage/:siteId
 * Get storage usage for a site
 */
router.get('/usage/:siteId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId } = req.params;
    const userId = req.user!.uid;
    const db = admin.firestore();

    // Verify site ownership
    const siteDoc = await db
      .collection('sites')
      .where('siteId', '==', siteId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (siteDoc.empty) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Get usage data
    const usageDocs = await db
      .collection('usage')
      .where('siteId', '==', siteId)
      .orderBy('month', 'desc')
      .limit(12)
      .get();

    const usage = usageDocs.docs.map((doc) => ({
      month: doc.data().month,
      storage: doc.data().storage, // in MB
      pageViews: doc.data().pageViews,
      bandwidth: doc.data().bandwidth, // in GB
    }));

    // Calculate current billing
    const currentUsage = usage[0] || { storage: 0 };
    const freeStorageMb = 250;
    const billableStorage = Math.max(0, currentUsage.storage - freeStorageMb);
    const storageUnits = Math.ceil(billableStorage / 500);
    const estimatedCharge = storageUnits * 1.0; // EUR 1 per 500MB

    return res.json({
      usage,
      currentStorage: currentUsage.storage,
      freeStorageMb,
      billableStorageMb: billableStorage,
      estimatedCharge: estimatedCharge,
      currency: 'EUR',
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return res.status(500).json({ error: 'Failed to get usage' });
  }
});

/**
 * GET /billing/session/:sessionId
 * Get checkout session details (siteId) for redirect after payment
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    if (!stripeService.isConfigured()) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }

    const session = await stripeService.getCheckoutSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json({
      siteId: session.metadata?.siteId || null,
      status: session.status,
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * GET /billing/status
 * Get billing status for the current user
 */
router.get('/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const db = admin.firestore();

    // Get user billing info
    const userBillingDoc = await db
      .collection('userBilling')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (userBillingDoc.empty) {
      return res.json({
        hasStripeAccount: false,
        paymentMethods: [],
        billingAddress: null,
      });
    }

    const data = userBillingDoc.docs[0].data();

    return res.json({
      hasStripeAccount: !!data.stripeCustomerId,
      paymentMethods: data.paymentMethods || [],
      billingAddress: data.billingAddress || null,
    });
  } catch (error) {
    console.error('Get billing status error:', error);
    return res.status(500).json({ error: 'Failed to get billing status' });
  }
});

export default router;
