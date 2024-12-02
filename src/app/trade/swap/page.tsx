import Swap from '@/components/Swap'
import TradeNav from '@/components/TradeNav'

export default function SwapPage() {
  return (
    <div className="max-w-lg mx-auto p-4">
      <TradeNav />
      <div className="mt-6">
        <Swap />
      </div>
    </div>
  )
} 