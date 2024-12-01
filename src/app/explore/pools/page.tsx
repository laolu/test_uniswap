import LiquidityPools from '@/components/LiquidityPools'

export default function PoolsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">资金池列表</h1>
      <LiquidityPools />
    </div>
  );
} 