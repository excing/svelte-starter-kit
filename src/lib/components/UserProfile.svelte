<script lang="ts">
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as Avatar from "$lib/components/ui/avatar";
    import { authClient } from "$lib/auth-client";
    import { Loader2 } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    interface UserInfo {
        id: string;
        name: string;
        image?: string | null | undefined;
        email: string;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }

    interface Props {
        mini?: boolean;
    }

    let { mini = false }: Props = $props();

    let userInfo = $state<UserInfo | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    onMount(async () => {
        await fetchUserData();
    });

    async function fetchUserData() {
        loading = true;
        error = null;

        try {
            const result = await authClient.getSession();

            if (!result.data?.user) {
                goto("/sign-in");
                return;
            }

            userInfo = result.data?.user;
        } catch (err) {
            console.error("Error fetching user data:", err);
            error =
                "Failed to load user profile. Please try refreshing the page.";
        } finally {
            loading = false;
        }
    }

    async function handleSignOut() {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    goto("/sign-in");
                },
            },
        });
    }
</script>

{#if error}
    <div
        class={`flex w-full items-center justify-start gap-2 rounded ${mini ? "" : "px-4 pb-3 pt-2"}`}
    >
        <div class="flex-1 text-sm text-red-500">
            {mini ? "Error" : error}
        </div>
    </div>
{:else}
    <DropdownMenu.Root>
        <DropdownMenu.Trigger
            class={`flex w-full items-center justify-start gap-2 rounded ${mini ? "" : "px-4 pb-3 pt-2"}`}
        >
            <Avatar.Root>
                {#if loading}
                    <div class="flex h-full w-full items-center justify-center">
                        <Loader2 class="h-4 w-4 animate-spin" />
                    </div>
                {:else if userInfo?.image}
                    <Avatar.Image src={userInfo.image} alt="User Avatar" />
                {:else}
                    <Avatar.Fallback>
                        {userInfo?.name
                            ? userInfo.name.charAt(0).toUpperCase()
                            : "U"}
                    </Avatar.Fallback>
                {/if}
            </Avatar.Root>
            {#if !mini}
                <div class="flex items-center gap-2">
                    <p class="text-md font-medium">
                        {loading ? "Loading..." : userInfo?.name || "User"}
                    </p>
                    {#if loading}
                        <Loader2 class="h-3 w-3 animate-spin" />
                    {/if}
                </div>
            {/if}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="w-56">
            <DropdownMenu.Label>My Account</DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
                <a href="/dashboard/settings?tab=profile">
                    <DropdownMenu.Item>
                        Profile
                        <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
                    </DropdownMenu.Item>
                </a>
                <a href="/dashboard/settings?tab=billing">
                    <DropdownMenu.Item>
                        Billing
                        <DropdownMenu.Shortcut>⌘B</DropdownMenu.Shortcut>
                    </DropdownMenu.Item>
                </a>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onclick={handleSignOut}>
                Log out
                <DropdownMenu.Shortcut>⇧⌘Q</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
{/if}
