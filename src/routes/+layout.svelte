<script lang="ts">
	import "../app.css";
	import { Toaster } from "$lib/components/ui/sonner";
	import { ModeWatcher } from "mode-watcher";

	let { children } = $props();
</script>

<svelte:head>
	<title>SvelteKit Starter Kit - Launch Your SAAS</title>
</svelte:head>

<ModeWatcher defaultMode="light" />
{@render children()}
<Toaster />
