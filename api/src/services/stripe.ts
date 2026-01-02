/**
 * Stripe Service
 * Handles subscription management, domain payments, and storage metering
 */

import Stripe from 'stripe';
import { config } from '../config/index.js';
import admin from 'firebase-admin';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!config.stripe.secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    stripeInstance = new Stripe(config.stripe.secretKey);
  }
  return stripeInstance;
}

export function isConfigured(): boolean {
  return !!config.stripe.secretKey;
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

/**
 * Get or create Stripe customer for a user
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const stripe = getStripe();
  const db = admin.firestore();

  // Check if user already has a Stripe customer ID
  const userBillingSnapshot = await db
    .collection('userBilling')
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (!userBillingSnapshot.empty) {
    const existingCustomerId = userBillingSnapshot.docs[0].data().stripeCustomerId;
    if (existingCustomerId) {
      return existingCustomerId;
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      firebaseUid: userId,
    },
  });

  // Save customer ID to Firestore
  if (!userBillingSnapshot.empty) {
    await userBillingSnapshot.docs[0].ref.update({
      stripeCustomerId: customer.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await db.collection('userBilling').add({
      userId,
      stripeCustomerId: customer.id,
      paymentMethods: [],
      billingAddress: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return customer.id;
}

// ============================================
// SUBSCRIPTION CHECKOUT
// ============================================

export type SubscriptionPlan = 'starter' | 'monthly' | 'annual' | 'biennial';

/**
 * Create a Stripe Checkout session for site subscription
 */
export async function createSubscriptionCheckout(params: {
  userId: string;
  email: string;
  siteId: string;
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
  withTrial?: boolean;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();

  const customerId = await getOrCreateCustomer(params.userId, params.email);

  const priceId = config.stripe.prices[params.plan];
  if (!priceId) {
    throw new Error(`Invalid plan: ${params.plan}`);
  }

  // Build subscription data with optional trial
  const subscriptionData: {
    metadata: { siteId: string; userId: string; plan: string };
    trial_period_days?: number;
  } = {
    metadata: {
      siteId: params.siteId,
      userId: params.userId,
      plan: params.plan,
    },
  };

  // Add trial period if requested (typically for new sites)
  if (params.withTrial) {
    subscriptionData.trial_period_days = config.stripe.trialDays;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      siteId: params.siteId,
      userId: params.userId,
      type: 'subscription',
      plan: params.plan,
    },
    subscription_data: subscriptionData,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    currency: 'eur',
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/**
 * Check if a plan allows custom domains
 */
export function planAllowsCustomDomain(plan: string): boolean {
  // Only pro plans (monthly, annual, biennial) allow custom domains
  return ['monthly', 'annual', 'biennial', 'pro', 'enterprise'].includes(plan);
}

// ============================================
// DOMAIN PURCHASE
// ============================================

/**
 * Create a Stripe Checkout session for domain purchase
 */
export async function createDomainCheckout(params: {
  userId: string;
  email: string;
  domain: string;
  years: number;
  namecheapPrice: number; // Price from Namecheap in USD
  successUrl: string;
  cancelUrl: string;
  contact?: {
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
}): Promise<{ sessionId: string; url: string; finalPriceEur: number }> {
  const stripe = getStripe();

  const customerId = await getOrCreateCustomer(params.userId, params.email);

  // Calculate price with markup (convert USD to EUR cents with markup)
  // Using approximate rate - in production should use real exchange rate API
  const usdToEur = 0.92;
  const baseEurPrice = params.namecheapPrice * usdToEur;
  const markup = config.stripe.domainMarkup;
  const finalPriceEur = baseEurPrice * (1 + markup);
  const priceInCents = Math.round(finalPriceEur * 100);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: priceInCents,
          product_data: {
            name: `Domain Registration: ${params.domain}`,
            description: `${params.years} year${params.years > 1 ? 's' : ''} registration`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'domain_purchase',
      userId: params.userId,
      domain: params.domain,
      years: params.years.toString(),
      namecheapPrice: params.namecheapPrice.toString(),
      // Store contact info in metadata for webhook
      ...(params.contact && {
        contactFirstName: params.contact.firstName,
        contactLastName: params.contact.lastName,
        contactAddress1: params.contact.address1,
        contactCity: params.contact.city,
        contactState: params.contact.stateProvince,
        contactPostalCode: params.contact.postalCode,
        contactCountry: params.contact.country,
        contactPhone: params.contact.phone,
        contactEmail: params.contact.email,
      }),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {
    sessionId: session.id,
    url: session.url!,
    finalPriceEur: Math.round(finalPriceEur * 100) / 100,
  };
}

/**
 * Create a Stripe Checkout session for domain purchase with explicit price (subscription style - yearly renewal)
 */
export async function createDomainCheckoutWithPrice(params: {
  userId: string;
  email: string;
  domain: string;
  years: number;
  priceEur: number; // Price in EUR per year (already includes markup)
  successUrl: string;
  cancelUrl: string;
  contact?: {
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
}): Promise<{ sessionId: string; url: string; finalPriceEur: number }> {
  const stripe = getStripe();

  const customerId = await getOrCreateCustomer(params.userId, params.email);

  // Convert EUR price to cents
  const priceInCents = Math.round(params.priceEur * 100);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: params.email,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: priceInCents,
          recurring: {
            interval: 'year',
            interval_count: 1,
          },
          product_data: {
            name: `Domain: ${params.domain}`,
            description: `Annual domain registration`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'domain_purchase',
      userId: params.userId,
      domain: params.domain,
      years: params.years.toString(),
      priceEur: params.priceEur.toString(),
      // Store contact info in metadata for webhook
      ...(params.contact && {
        contactFirstName: params.contact.firstName,
        contactLastName: params.contact.lastName,
        contactAddress1: params.contact.address1,
        contactCity: params.contact.city,
        contactState: params.contact.stateProvince,
        contactPostalCode: params.contact.postalCode,
        contactCountry: params.contact.country,
        contactPhone: params.contact.phone,
        contactEmail: params.contact.email,
      }),
    },
    subscription_data: {
      metadata: {
        type: 'domain_subscription',
        userId: params.userId,
        domain: params.domain,
      },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {
    sessionId: session.id,
    url: session.url!,
    finalPriceEur: params.priceEur,
  };
}

// ============================================
// STORAGE METERING
// ============================================

/**
 * Report storage usage for a site (called periodically)
 * TODO: Implement when Stripe Billing Meters are set up
 */
export async function reportStorageUsage(_siteId: string, _storageUsedMb: number): Promise<void> {
  // Storage metering requires Stripe Billing Meters setup
  // For now, this is a placeholder - implement when needed
  console.log('[Stripe] Storage metering not yet implemented');
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Update subscription plan
 */
export async function updateSubscriptionPlan(
  subscriptionId: string,
  newPlan: SubscriptionPlan
): Promise<void> {
  const stripe = getStripe();

  const newPriceId = config.stripe.prices[newPlan];
  if (!newPriceId) {
    throw new Error(`Invalid plan: ${newPlan}`);
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItem = subscription.items.data[0];

  await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscriptionItem.id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripe();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  return paymentMethods.data;
}

/**
 * Create portal session for customer to manage billing
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Get subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Get checkout session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Construct webhook event from raw body and signature
 */
export function constructWebhookEvent(
  rawBody: Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}
