<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import type { Snippet } from "svelte";

    let {
        href = undefined,
        onclick = undefined,
        children,
        class: className = undefined,
        ...rest
    } = $props<{
        href?: string;
        onclick?: (e: MouseEvent) => void;
        children?: Snippet;
        class?: string;
        [key: string]: any;
    }>();

    let isAuthenticated = $state<boolean | null>(null);

    onMount(async () => {
        try {
            const session = await authClient.getSession();
            isAuthenticated = !!session.data?.user;
        } catch {
            isAuthenticated = false;
        }
    });

    async function handleClick(e: MouseEvent) {
        if (isAuthenticated === false) {
            e.preventDefault();
            goto("/sign-in");
            return;
        }

        if (onclick) {
            onclick(e);
        }
    }
</script>

<Button
    {...rest}
    class={className}
    href={isAuthenticated === false ? "/sign-in" : href}
    onclick={handleClick}
>
    {#if isAuthenticated === false}
        Sign In to Get Started
    {:else}
        {@render children?.()}
    {/if}
</Button>
