// Endurl constants

export const ENDURL = {
  // server status
  GET_SERVER_STATUS: 'ticker/admin/server-status',
  POST_SMART_LOGIN: 'ticker/admin/smart-login',

  // Raw Stock
  GET_RAW_STOCKS: 'ticker/admin/raw-stocks',
  GET_RAW_STOCK_BY_ID: 'ticker/admin/raw-stock/:id',
  POST_RAW_STOCK: 'ticker/admin/raw-stock',
  POST_RAW_STOCK_STATUS: 'ticker/master/create',
  POST_RAW_STOCK_PRICE: 'ticker/admin/raw-stock-price',

  // Stock Endpoints
  GET_ALL_ACTIVE_STOCKS: 'ticker/activestock',
  GET_STOCK_BY_SYMBOL: 'ticker/stocks/symbol/:symbol',
  GET_STOCK_BY_ID: 'ticker/stocks/:id',

  // Stock Fundamental
  Fetch_STOCK_FUNDAMENTAL: 'ticker/fundamentals/fetch',
  GET_STOCK_FUNDAMENTAL_DETAILS: 'ticker/fundamentals',

  // IPO GMP
  FETCH_IPO_GMP: 'ticker/ipo-gmp',

  // Master Stock
  GET_MASTER_STOCKS: 'ticker/master',

  // authentication
  REGISTER: 'user/auth/register',
  LOGIN: 'user/auth/login',
  VERIFY_EMAIL: 'user/auth/verify-email',
  RESEND_OTP: 'user/auth/resend-verification-otp',
  FORGOT_PASSWORD: 'user/auth/forgot-password',
  RESET_PASSWORD: 'user/auth/reset-password',

  // Portfolio
  GET_PORTFOLIO_TYPES: 'user/portfolio-types',
  GET_MY_PORTFOLIOS: 'user/my-portfolios',
  CREATE_PORTFOLIO: 'user/my-portfolios',
  GET_MY_PORTFOLIO_BY_ID: 'user/my-portfoliaaaos/:id',
  CREATE_ORDER: 'user/order/place',
  GET_STOCK_HOLDINGS: 'user/my-portfolios/holdings',
  GET_PORTFOLIO_DETAILS: 'user/my-portfolios/:portfolioId/holdings',
  GET_PORTFOLIO_HOLDING_ORDERS: 'user/my-portfolios/:portfolioId/holdings/:activeStockId/orders',
  GET_OPEN_ORDERS: 'user/order/open/:portfolioId',
  GET_OVERVIEW: 'user/dashboard',
  GET_DASHBOARD: 'user/dashboard',
  LOAD_WALLET_FUND: 'user/wallet/load',
  TRANSFER_WALLET_TO_PORTFOLIO: 'user/wallet/transfer-to-portfolio/:portfolioId'
}

