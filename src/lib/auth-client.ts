import { createAuthClient } from 'better-auth/svelte';
import { polarClient } from '@polar-sh/better-auth/client';
import { emailOTPClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
    plugins: [
        polarClient(),
        emailOTPClient(),
    ]
});
