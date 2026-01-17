import { db } from '$lib/server/db';
import { account, session, subscription, user, verification } from '$lib/server/db/schema';
import { checkout, polar, portal, usage, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from '$env/dynamic/private';
import { PUBLIC_APP_URL } from '$env/static/public';

const POLAR_ENVIRONMENT = (env.POLAR_ENVIRONMENT as 'sandbox' | 'production' | undefined) || 'sandbox';
const POLAR_ACCESS_TOKEN = env.POLAR_ACCESS_TOKEN!;
const POLAR_WEBHOOK_SECRET = env.POLAR_WEBHOOK_SECRET!;
const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET!;

// Utility function to safely parse dates
function safeParseDate(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    return new Date(value);
}

const polarClient = new Polar({
    accessToken: POLAR_ACCESS_TOKEN,
    server: POLAR_ENVIRONMENT
});

export const auth = betterAuth({
    trustedOrigins: [PUBLIC_APP_URL],
    allowedDevOrigins: [PUBLIC_APP_URL],
    cookieCache: {
        enabled: true,
        maxAge: 5 * 60 // Cache duration in seconds
    },
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user,
            session,
            account,
            verification,
            subscription
        }
    }),
    socialProviders: {
        google: {
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET
        }
    },
    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    successUrl: `${PUBLIC_APP_URL}/success?checkout_id={CHECKOUT_ID}`,
                    authenticatedUsersOnly: true
                }),
                portal(),
                usage(),
                webhooks({
                    secret: POLAR_WEBHOOK_SECRET,
                    onPayload: async ({ data, type }) => {
                        if (
                            type === 'subscription.created' ||
                            type === 'subscription.active' ||
                            type === 'subscription.canceled' ||
                            type === 'subscription.revoked' ||
                            type === 'subscription.uncanceled' ||
                            type === 'subscription.updated'
                        ) {
                            console.log('🎯 Processing subscription webhook:', type);
                            console.log('📦 Payload data:', JSON.stringify(data, null, 2));

                            try {
                                // STEP 1: Extract user ID from customer data
                                const userId = data.customer?.externalId;
                                // STEP 2: Build subscription data
                                const subscriptionData = {
                                    id: data.id,
                                    createdAt: new Date(data.createdAt),
                                    modifiedAt: safeParseDate(data.modifiedAt),
                                    amount: data.amount,
                                    currency: data.currency,
                                    recurringInterval: data.recurringInterval,
                                    status: data.status,
                                    currentPeriodStart: safeParseDate(data.currentPeriodStart) || new Date(),
                                    currentPeriodEnd: safeParseDate(data.currentPeriodEnd) || new Date(),
                                    cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
                                    canceledAt: safeParseDate(data.canceledAt),
                                    startedAt: safeParseDate(data.startedAt) || new Date(),
                                    endsAt: safeParseDate(data.endsAt),
                                    endedAt: safeParseDate(data.endedAt),
                                    customerId: data.customerId,
                                    productId: data.productId,
                                    discountId: data.discountId || null,
                                    checkoutId: data.checkoutId || '',
                                    customerCancellationReason: data.customerCancellationReason || null,
                                    customerCancellationComment: data.customerCancellationComment || null,
                                    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                                    customFieldData: data.customFieldData
                                        ? JSON.stringify(data.customFieldData)
                                        : null,
                                    userId: userId as string | null
                                };

                                console.log('💾 Final subscription data:', {
                                    id: subscriptionData.id,
                                    status: subscriptionData.status,
                                    userId: subscriptionData.userId,
                                    amount: subscriptionData.amount
                                });

                                // STEP 3: Use Drizzle's onConflictDoUpdate for proper upsert
                                await db
                                    .insert(subscription)
                                    .values(subscriptionData)
                                    .onConflictDoUpdate({
                                        target: subscription.id,
                                        set: {
                                            modifiedAt: subscriptionData.modifiedAt || new Date(),
                                            amount: subscriptionData.amount,
                                            currency: subscriptionData.currency,
                                            recurringInterval: subscriptionData.recurringInterval,
                                            status: subscriptionData.status,
                                            currentPeriodStart: subscriptionData.currentPeriodStart,
                                            currentPeriodEnd: subscriptionData.currentPeriodEnd,
                                            cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
                                            canceledAt: subscriptionData.canceledAt,
                                            startedAt: subscriptionData.startedAt,
                                            endsAt: subscriptionData.endsAt,
                                            endedAt: subscriptionData.endedAt,
                                            customerId: subscriptionData.customerId,
                                            productId: subscriptionData.productId,
                                            discountId: subscriptionData.discountId,
                                            checkoutId: subscriptionData.checkoutId,
                                            customerCancellationReason: subscriptionData.customerCancellationReason,
                                            customerCancellationComment: subscriptionData.customerCancellationComment,
                                            metadata: subscriptionData.metadata,
                                            customFieldData: subscriptionData.customFieldData,
                                            userId: subscriptionData.userId
                                        }
                                    });

                                console.log('✅ Upserted subscription:', data.id);
                            } catch (error) {
                                console.error('💥 Error processing subscription webhook:', error);
                                // Don't throw - let webhook succeed to avoid retries
                            }
                        }
                    }
                })
            ]
        })
    ]
});

export type Session = typeof auth.$Infer.Session;
