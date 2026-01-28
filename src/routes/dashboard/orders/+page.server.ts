import { db } from '$lib/server/db';
import { order } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
    const { session } = await parent();

    if (!session?.user?.id) {
        return { orders: [] };
    }

    const orders = await db
        .select()
        .from(order)
        .where(eq(order.userId, session.user.id))
        .orderBy(desc(order.createdAt));

    return {
        orders: orders.map((o) => ({
            id: o.id,
            productId: o.productId,
            productName: o.productName,
            status: o.status,
            paid: o.paid,
            totalAmount: o.totalAmount,
            currency: o.currency,
            createdAt: o.createdAt.toISOString(),
            billingReason: o.billingReason,
            invoiceNumber: o.invoiceNumber
        }))
    };
};
