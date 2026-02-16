export interface PortfolioType {
  _id: string
  code: string
  display_name: string
  description: string
  risk_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  important_notes: string[]
  initial_fund: number
}

export interface MyPortfolio {
  _id: string
  name: string
  portfolio_type_id: {
    display_name: string
    risk_level: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  }
  initial_fund: number
  available_fund: number
  pnl: number
  created_at: string
}
