/**
 * Webhook Routes
 * Handles Stripe webhook events
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { config } from '../config/index.js';
import admin from 'firebase-admin';
import * as namecheap from '../services/namecheap.js';
import * as stripeService from '../services/stripe.js';

const router = Router();

/**
 * Helper to get subscription period dates
 * Stripe SDK types can vary, so we safely extract the values
 */
function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: number;
  end: number;
} {
  // Access the properties using bracket notation to work around strict types
  const sub = subscription as unknown as {
    current_period_start: number;
    current_period_end: number;
  };
  return {
    start: sub.current_period_start,
    end: sub.current_period_end,
  };
}

/**
 * Format phone number to Namecheap's required format: +CountryCode.PhoneNumber
 */
function formatPhoneForNamecheap(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  if (/^\+\d{1,3}\.\d+$/.test(phone)) {
    return phone;
  }

  const withoutPlus = cleaned.substring(1);
  let countryCodeLength = 2;

  if (withoutPlus.startsWith('1') && withoutPlus.length === 11) {
    countryCodeLength = 1;
  } else if (
    /^(35[0-9]|37[0-9]|38[0-9]|42[0-9]|50[0-9]|59[0-9]|67[0-9]|68[0-9]|85[0-9]|88[0-9]|96[0-9]|97[0-9]|99[0-9])/.test(
      withoutPlus
    )
  ) {
    countryCodeLength = 3;
  }

  const countryCode = withoutPlus.substring(0, countryCodeLength);
  const phoneNumber = withoutPlus.substring(countryCodeLength);

  return `+${countryCode}.${phoneNumber}`;
}

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events
 *
 * Note: This route requires raw body parsing, which is configured in index.ts
 */
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    console.error('[Webhook] No stripe-signature header');
    return res.status(400).send('Missing stripe-signature header');
  }

  let event: Stripe.Event;

  try {
    event = stripeService.constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  const db = admin.firestore();

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        if (metadata.type === 'subscription') {
          // Handle subscription creation
          await handleSubscriptionCreated(session, db);
        } else if (metadata.type === 'domain_purchase') {
          // Handle domain purchase
          await handleDomainPurchase(session, db);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice, db);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, db);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, db);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, db);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Handle subscription creation from checkout
 */
async function handleSubscriptionCreated(
  session: Stripe.Checkout.Session,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const metadata = session.metadata || {};
  const subscriptionId = session.subscription as string;

  console.log(`[Webhook] Processing subscription for site ${metadata.siteId}`);
  console.log(`[Webhook] Subscription ID: ${subscriptionId}`);

  // Get subscription details from Stripe
  const subscription = await stripeService.getSubscription(subscriptionId);
  console.log(`[Webhook] Subscription status: ${subscription.status}`);

  const period = getSubscriptionPeriod(subscription);
  console.log(`[Webhook] Period: start=${period.start}, end=${period.end}`);

  // Validate period values
  const now = Math.floor(Date.now() / 1000);
  const periodStart = period.start && Number.isFinite(period.start) ? period.start : now;
  const periodEnd = period.end && Number.isFinite(period.end) ? period.end : now + (30 * 24 * 60 * 60); // Default 30 days

  console.log(`[Webhook] Using period: start=${periodStart}, end=${periodEnd}`);

  const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
  console.log(`[Webhook] Mapped plan: ${plan}`);

  // Check if siteBilling already exists
  const existingDoc = await db
    .collection('siteBilling')
    .where('siteId', '==', metadata.siteId)
    .limit(1)
    .get();

  const billingData = {
    siteId: metadata.siteId,
    userId: metadata.userId,
    plan: plan,
    status: 'active',
    subscriptionId: subscriptionId,
    stripeCustomerId: session.customer as string,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(periodStart * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(periodEnd * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  console.log(`[Webhook] Billing data to save:`, JSON.stringify({
    ...billingData,
    currentPeriodStart: new Date(periodStart * 1000).toISOString(),
    currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
  }, null, 2));

  if (existingDoc.empty) {
    console.log(`[Webhook] Creating new siteBilling document`);
    await db.collection('siteBilling').add({
      ...billingData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    console.log(`[Webhook] Updating existing siteBilling document: ${existingDoc.docs[0].id}`);
    await existingDoc.docs[0].ref.update(billingData);
  }

  console.log(`[Webhook] Subscription created successfully for site ${metadata.siteId}`);
}

/**
 * Handle domain purchase from checkout
 */
async function handleDomainPurchase(
  session: Stripe.Checkout.Session,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const metadata = session.metadata || {};
  const domain = metadata.domain;
  const years = parseInt(metadata.years);
  const userId = metadata.userId;

  console.log(`[Webhook] Processing domain purchase: ${domain} for ${years} years`);

  // Build contact info from metadata
  const contact = {
    firstName: metadata.contactFirstName || '',
    lastName: metadata.contactLastName || '',
    address1: metadata.contactAddress1 || '',
    city: metadata.contactCity || '',
    stateProvince: metadata.contactState || '',
    postalCode: metadata.contactPostalCode || '',
    country: metadata.contactCountry || 'US',
    phone: formatPhoneForNamecheap(metadata.contactPhone || '+1.0000000000'),
    email: metadata.contactEmail || session.customer_email || '',
  };

  // Validate contact info
  if (!contact.firstName || !contact.lastName || !contact.email) {
    console.error('[Webhook] Missing contact information for domain registration');

    await db.collection('domainPurchases').add({
      userId,
      domain,
      years,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      status: 'failed',
      error: 'Missing contact information',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return;
  }

  try {
    // Register domain with Namecheap
    const result = await namecheap.registerDomain(domain, years, contact);

    if (result.registered) {
      console.log(`[Webhook] Domain ${domain} registered successfully`);

      await db.collection('domainPurchases').add({
        userId,
        domain,
        years,
        orderId: result.orderId,
        transactionId: result.transactionId,
        chargedAmount: result.chargedAmount,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        status: 'registered',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      console.error(`[Webhook] Domain registration failed: ${result.error}`);

      await db.collection('domainPurchases').add({
        userId,
        domain,
        years,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        status: 'failed',
        error: result.error,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('[Webhook] Domain registration error:', error);

    await db.collection('domainPurchases').add({
      userId,
      domain,
      years,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Handle invoice paid event
 */
async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  // Get subscription ID from invoice (access via bracket notation for compatibility)
  const invoiceData = invoice as unknown as { subscription?: string | { id: string } | null };
  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id;

  if (!subscriptionId) {
    console.log(`[Webhook] Invoice paid but no subscription ID found`);
    return;
  }

  console.log(`[Webhook] Invoice paid for subscription ${subscriptionId}`);

  const subscription = await stripeService.getSubscription(subscriptionId);
  const period = getSubscriptionPeriod(subscription);
  console.log(`[Webhook] Invoice period: start=${period.start}, end=${period.end}`);

  // Validate period values
  const now = Math.floor(Date.now() / 1000);
  const periodStart = period.start && Number.isFinite(period.start) ? period.start : now;
  const periodEnd = period.end && Number.isFinite(period.end) ? period.end : now + (30 * 24 * 60 * 60);

  const siteBillingQuery = await db
    .collection('siteBilling')
    .where('subscriptionId', '==', subscriptionId)
    .limit(1)
    .get();

  if (!siteBillingQuery.empty) {
    console.log(`[Webhook] Updating siteBilling for invoice paid`);
    await siteBillingQuery.docs[0].ref.update({
      status: 'active',
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(periodStart * 1000),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(periodEnd * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    console.log(`[Webhook] No siteBilling found for subscription ${subscriptionId}`);
  }
}

/**
 * Handle invoice payment failed event
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  // Get subscription ID from invoice (access via bracket notation for compatibility)
  const invoiceData = invoice as unknown as { subscription?: string | { id: string } | null };
  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id;

  if (!subscriptionId) return;

  console.log(`[Webhook] Invoice payment failed for subscription ${subscriptionId}`);

  const siteBillingQuery = await db
    .collection('siteBilling')
    .where('subscriptionId', '==', subscriptionId)
    .limit(1)
    .get();

  if (!siteBillingQuery.empty) {
    await siteBillingQuery.docs[0].ref.update({
      status: 'past_due',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  console.log(`[Webhook] Subscription deleted: ${subscription.id}`);

  const siteBillingQuery = await db
    .collection('siteBilling')
    .where('subscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (!siteBillingQuery.empty) {
    await siteBillingQuery.docs[0].ref.update({
      status: 'cancelled',
      plan: 'free',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  console.log(`[Webhook] Subscription updated: ${subscription.id}`);

  const period = getSubscriptionPeriod(subscription);
  console.log(`[Webhook] Update period: start=${period.start}, end=${period.end}`);

  // Validate period values
  const now = Math.floor(Date.now() / 1000);
  const periodStart = period.start && Number.isFinite(period.start) ? period.start : now;
  const periodEnd = period.end && Number.isFinite(period.end) ? period.end : now + (30 * 24 * 60 * 60);

  const siteBillingQuery = await db
    .collection('siteBilling')
    .where('subscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (!siteBillingQuery.empty) {
    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    console.log(`[Webhook] Updating subscription to plan: ${plan}, status: ${subscription.status}`);
    await siteBillingQuery.docs[0].ref.update({
      plan: plan,
      status: subscription.status === 'active' ? 'active' : 'past_due',
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(periodStart * 1000),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(periodEnd * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    console.log(`[Webhook] No siteBilling found for subscription ${subscription.id}`);
  }
}

/**
 * Map Stripe price ID to plan name
 * Plans: free (trial), starter (no custom domain), pro (with custom domain)
 */
function getPlanFromPriceId(priceId: string): 'free' | 'starter' | 'pro' {
  const { prices } = config.stripe;

  console.log(`[Webhook] getPlanFromPriceId called with priceId: ${priceId}`);
  console.log(`[Webhook] Config prices:`, JSON.stringify(prices, null, 2));

  if (priceId === prices.starter) {
    console.log(`[Webhook] Matched starter plan (no custom domain)`);
    return 'starter';
  }
  if (priceId === prices.monthly) {
    console.log(`[Webhook] Matched monthly -> pro plan`);
    return 'pro';
  }
  if (priceId === prices.annual) {
    console.log(`[Webhook] Matched annual -> pro plan`);
    return 'pro';
  }
  if (priceId === prices.biennial) {
    console.log(`[Webhook] Matched biennial -> pro plan`);
    return 'pro';
  }

  console.log(`[Webhook] No match found, defaulting to free`);
  return 'free';
}

export default router;
