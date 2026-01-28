<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import * as Table from "$lib/components/ui/table";

    let { data } = $props();
</script>

<div class="space-y-4 p-6">
    <Card.Root>
        <Card.Header>
            <Card.Title>我的订单</Card.Title>
            <Card.Description>查看您购买的 one-time products</Card.Description>
        </Card.Header>
        <Card.Content>
            {#if data.orders.length === 0}
                <p class="text-muted-foreground text-center py-8">暂无订单</p>
            {:else}
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.Head>订单号</Table.Head>
                            <Table.Head>产品名称</Table.Head>
                            <Table.Head>状态</Table.Head>
                            <Table.Head>金额</Table.Head>
                            <Table.Head>日期</Table.Head>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {#each data.orders as order}
                            <Table.Row>
                                <Table.Cell class="font-mono text-sm">
                                    {order.invoiceNumber ||
                                        order.id.slice(0, 8)}
                                </Table.Cell>
                                <Table.Cell class="font-medium">
                                    {order.productName}
                                </Table.Cell>
                                <Table.Cell>
                                    <span
                                        class="capitalize {order.paid
                                            ? 'text-green-600'
                                            : 'text-yellow-600'}"
                                    >
                                        {order.status}
                                    </span>
                                </Table.Cell>
                                <Table.Cell>
                                    {(order.totalAmount / 100).toFixed(2)}
                                    {order.currency.toUpperCase()}
                                </Table.Cell>
                                <Table.Cell>
                                    {new Date(
                                        order.createdAt,
                                    ).toLocaleDateString()}
                                </Table.Cell>
                            </Table.Row>
                        {/each}
                    </Table.Body>
                </Table.Root>
            {/if}
        </Card.Content>
    </Card.Root>
</div>
