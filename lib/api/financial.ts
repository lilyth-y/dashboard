/**
 * Financial API Service
 */

import { apiClient } from '../api-client'

export type TransactionType = 'INCOME' | 'EXPENSE'

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category: string
  description: string | null
  date: string
  projectId: string | null
  createdBy: string
  createdAt: string
  project?: {
    name: string
  } | null
}

export interface CreateTransactionInput {
  amount: number
  type: TransactionType
  category: string
  description?: string
  date: string
  projectId?: string | null
}

export interface TransactionListParams {
  page?: number
  limit?: number
  type?: TransactionType
  category?: string
}

export interface TransactionListResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface DashboardData {
  recentTransactions: Transaction[]
  monthlyStats: Array<{
    type: TransactionType
    _sum: { amount: number | null }
  }>
  expensesByCategory: Array<{
    category: string
    type: TransactionType
    _sum: { amount: number | null }
  }>
  dailyTrends: Array<{
    date: string
    type: TransactionType
    total: number
  }>
  summary: {
    totalIncome: number
    totalExpense: number
    netProfit: number
  }
}

// API methods
export const financialApi = {
  /**
   * Create new transaction
   */
  async createTransaction(input: CreateTransactionInput): Promise<{ id: string; transaction: Transaction }> {
    return apiClient.post<{ id: string; transaction: Transaction }>('/financial/transactions', input)
  },

  /**
   * Get transactions list with pagination
   */
  async listTransactions(params?: TransactionListParams): Promise<TransactionListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.type) queryParams.set('type', params.type)
    if (params?.category) queryParams.set('category', params.category)

    const query = queryParams.toString()
    const path = query ? `/financial/transactions?${query}` : '/financial/transactions'
    
    return apiClient.get<TransactionListResponse>(path)
  },

  /**
   * Get financial dashboard data
   */
  async getDashboard(): Promise<DashboardData> {
    return apiClient.get<DashboardData>('/financial/dashboard')
  },
}
