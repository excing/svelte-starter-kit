<script lang="ts">
    import HeroSection from "$lib/components/homepage/HeroSection.svelte";
    import Integrations from "$lib/components/homepage/Integrations.svelte";
    import PricingTable from "$lib/components/pricing/PricingTable.svelte";
    import Footer from "$lib/components/homepage/Footer.svelte";

    let { data } = $props();
</script>

<HeroSection />
<Integrations />
<PricingTable subscriptionDetails={data.subscriptionDetails} />
<Footer />
