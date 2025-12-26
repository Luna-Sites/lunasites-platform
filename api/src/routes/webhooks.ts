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

  // Get subscription details from Stripe
  const subscription = await stripeService.getSubscription(subscriptionId);

  // Check if siteBilling already exists
  const existingDoc = await db
    .collection('siteBilling')
    .where('siteId', '==', metadata.siteId)
    .limit(1)
    .get();

  const billingData = {
    siteId: metadata.siteId,
    userId: metadata.userId,
    plan: getPlanFromPriceId(subscription.items.data[0].price.id),
    status: 'active',
    subscriptionId: subscriptionId,
    stripeCustomerId: session.customer as string,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(
      subscription.current_period_start * 1000
    ),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (existingDoc.empty) {
    await db.collection('siteBilling').add({
      ...billingData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await existingDoc.docs[0].ref.update(billingData);
  }

  console.log(`[Webhook] Subscription created for site ${metadata.siteId}`);
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
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  console.log(`[Webhook] Invoice paid for subscription ${subscriptionId}`);

  const subscription = await stripeService.getSubscription(subscriptionId);

  const siteBillingQuery = await db
    .collection('siteBilling')
    .where('subscriptionId', '==', subscriptionId)
    .limit(1)
    .get();

  if (!siteBillingQuery.empty) {
    await siteBillingQuery.docs[0].ref.update({
      status: 'active',
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(
        subscription.current_period_start * 1000
      ),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Handle invoice payment failed event
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const subscriptionId = invoice.subscription as string;

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

  const siteBillingQuery = await db
    .collection('siteBilling')
    .where('subscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (!siteBillingQuery.empty) {
    await siteBillingQuery.docs[0].ref.update({
      plan: getPlanFromPriceId(subscription.items.data[0].price.id),
      status: subscription.status === 'active' ? 'active' : 'past_due',
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(
        subscription.current_period_start * 1000
      ),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Map Stripe price ID to plan name
 */
function getPlanFromPriceId(priceId: string): 'free' | 'starter' | 'pro' | 'enterprise' {
  const { prices } = config.stripe;

  if (priceId === prices.starter) return 'starter';
  if (priceId === prices.monthly) return 'pro';
  if (priceId === prices.annual) return 'pro';
  if (priceId === prices.biennial) return 'enterprise'; // Use enterprise for best plan

  return 'free';
}

export default router;
