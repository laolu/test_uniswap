import Buy from '@/components/Buy'
import TradeNav from '@/components/TradeNav'

export default function BuyPage() {
  return (
    <div className="max-w-lg mx-auto p-4">
      <TradeNav />
      <div className="mt-6">
        <Buy />
      </div>
    </div>
  )
} 