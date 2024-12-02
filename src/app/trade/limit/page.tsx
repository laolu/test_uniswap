import LimitOrder from '@/components/LimitOrder'
import TradeNav from '@/components/TradeNav'

export default function LimitOrderPage() {
  return (
    <div className="max-w-lg mx-auto p-4">
      <TradeNav />
      <div className="mt-6">
        <LimitOrder />
      </div>
    </div>
  )
} 