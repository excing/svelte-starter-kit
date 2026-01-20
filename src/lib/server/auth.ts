import { db } from '$lib/server/db';
import { account, session, subscription, user, verification } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { checkout, polar, portal, usage, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { env } from '$env/dynamic/private';
import { PUBLIC_APP_URL } from '$env/static/public';
import { Resend } from 'resend';

const POLAR_ENVIRONMENT = (env.POLAR_ENVIRONMENT as 'sandbox' | 'production' | undefined) || 'sandbox';
const POLAR_ACCESS_TOKEN = env.POLAR_ACCESS_TOKEN!;
const POLAR_WEBHOOK_SECRET = env.POLAR_WEBHOOK_SECRET!;
const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET!;
const RESEND_API_KEY = env.RESEND_API_KEY!;
const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL || 'noreply@example.com';
const EMAIL_VERIFICATION_MODE = (env.EMAIL_VERIFICATION_MODE as 'otp' | 'required' | 'optional') || 'optional';

const resend = new Resend(RESEND_API_KEY);

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
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        requireEmailVerification: EMAIL_VERIFICATION_MODE === 'required',
        sendResetPassword: async ({ user, url }) => {
            await resend.emails.send({
                from: RESEND_FROM_EMAIL,
                to: user.email,
                subject: '重置密码 - SvelteKit Starter Kit',
                html: `
                    <h2>重置密码</h2>
                    <p>您好 ${user.name}，</p>
                    <p>点击下面的链接重置您的密码：</p>
                    <a href="${url}" style="display:inline-block;padding:12px 24px;background:#0070f3;color:white;text-decoration:none;border-radius:6px;">重置密码</a>
                    <p>如果您没有请求重置密码，请忽略此邮件。</p>
                `,
            });
        },
    },
    // 链接验证模式 (用于 required 和 optional 模式)
    ...(EMAIL_VERIFICATION_MODE !== 'otp' ? {
        emailVerification: {
            sendVerificationEmail: async ({ user, url }) => {
                await resend.emails.send({
                    from: RESEND_FROM_EMAIL,
                    to: user.email,
                    subject: '验证您的邮箱 - SvelteKit Starter Kit',
                    html: `
                        <h2>验证邮箱</h2>
                        <p>您好 ${user.name}，</p>
                        <p>点击下面的链接验证您的邮箱：</p>
                        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#0070f3;color:white;text-decoration:none;border-radius:6px;">验证邮箱</a>
                    `,
                });
            },
        },
    } : {}),
    plugins: [
        // OTP 验证码插件 (仅 otp 模式启用)
        ...(EMAIL_VERIFICATION_MODE === 'otp' ? [
            emailOTP({
                otpLength: 6,
                expiresIn: 300, // 5分钟
                sendVerificationOnSignUp: true,
                async sendVerificationOTP({ email, otp, type }) {
                    const subjects: Record<string, string> = {
                        'sign-in': '登录验证码',
                        'email-verification': '邮箱验证码',
                        'forget-password': '密码重置验证码',
                    };
                    await resend.emails.send({
                        from: RESEND_FROM_EMAIL,
                        to: email,
                        subject: `${subjects[type] || '验证码'} - SvelteKit Starter Kit`,
                        html: `
                            <h2>${subjects[type] || '验证码'}</h2>
                            <p>您的验证码是：</p>
                            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px;background:#f5f5f5;text-align:center;border-radius:8px;">${otp}</div>
                            <p>验证码 5 分钟内有效，请勿泄露给他人。</p>
                        `,
                    });
                },
            })
        ] : []),
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
    ],
    // 全局 before hook：在发送注册验证码前检查邮箱是否已存在
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            // 仅拦截发送验证码的请求
            if (ctx.path === '/email-otp/send-verification-otp' && ctx.body?.type === 'email-verification') {
                const email = ctx.body.email?.toLowerCase();
                if (email) {
                    const existingUser = await db
                        .select({ id: user.id })
                        .from(user)
                        .where(eq(user.email, email))
                        .limit(1);
                    if (existingUser.length > 0) {
                        throw new APIError('BAD_REQUEST', {
                            message: '该邮箱已注册，请直接登录',
                            code: 'USER_ALREADY_EXISTS'
                        });
                    }
                }
            }
        })
    }
});

export type Session = typeof auth.$Infer.Session;
