"use client"

import { Plus } from "lucide-react"
import { useState } from "react"

import TransactionForm from "@/components/kokonutui/transaction-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false)

  const handleTransactionSuccess = () => {
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">거래 관리</h1>
          <p className="text-gray-600 dark:text-gray-400">수입과 지출을 관리하세요</p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              거래 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 거래 등록</DialogTitle>
              <DialogDescription>
                새로운 수입 또는 지출 거래를 등록하세요.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm onSuccess={handleTransactionSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">최근 거래 내역</h2>
        <p className="text-gray-500">거래 내역은 메인 대시보드에서 확인할 수 있습니다.</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => window.location.href = '/dashboard'}
        >
          대시보드로 이동
        </Button>
      </div>
    </div>
  )
}
