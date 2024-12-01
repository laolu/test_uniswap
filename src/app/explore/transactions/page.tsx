import TransactionList from '@/components/TransactionList'

export default function TransactionsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">交易记录</h1>
      <TransactionList />
    </div>
  )
} 