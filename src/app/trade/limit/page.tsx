import LimitOrder from '@/components/LimitOrder'
import TradeNav from '@/components/TradeNav'

export default function LimitOrderPage() {
  return (
    <>
      <div className="max-w-lg mx-auto mt-8 p-4">
        <TradeNav />
        <LimitOrder />
      </div>
    </>
  )
} 