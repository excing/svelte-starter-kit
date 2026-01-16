import { getSubscriptionDetails } from '$lib/server/subscription';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    const subscriptionDetails = await getSubscriptionDetails(event);
    return {
        subscriptionDetails
    };
};
