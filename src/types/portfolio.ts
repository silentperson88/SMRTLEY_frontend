export interface PortfolioType {
  id: string
  code: string
  display_name: string
  description: string
  fund: number | null
  risk_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  rules_json?: Record<string, unknown>
  important_notes: string[]
  is_active?: boolean
  created_at?: string
  updated_at?: string
  createdAt?: string
  updatedAt?: string
}

export interface MyPortfolio {
  id: string
  name: string
  portfolio_type: {
    id?: string
    display_name: string
    risk_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  }
  initial_fund: number
  available_fund: number
  pnl: number
  created_at: string
}
