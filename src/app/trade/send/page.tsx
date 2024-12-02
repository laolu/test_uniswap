import Send from '@/components/Send'
import TradeNav from '@/components/TradeNav'

export default function SendPage() {
  return (
    <div className="max-w-lg mx-auto p-4">
      <TradeNav />
      <div className="mt-6">
        <Send />
      </div>
    </div>
  )
} 