<script lang="ts">
    import PricingTable from "$lib/components/pricing/PricingTable.svelte";

    let { data } = $props();
</script>

<div class="flex min-h-screen w-full flex-col items-center justify-center">
    <PricingTable subscriptionDetails={data.subscriptionDetails} />
</div>
