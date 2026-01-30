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

  // Master Stock
  GET_MASTER_STOCKS: 'ticker/master',

  // authentication
  REGISTER: 'user/auth/register',
  LOGIN: 'user/auth/login',

  // Portfolio
  GET_PORTFOLIO_TYPES: 'user/portfolio-types',
  GET_MY_PORTFOLIOS: 'user/portfolios',

  // GET_PORTFOLIOS: 'ticker/portfolios',
  // POST_PORTFOLIO: 'ticker/portfolios',
  // GET_PORTFOLIO_BY_ID: 'ticker/portfolios/:id',
  // DELETE_PORTFOLIO_BY_ID: 'ticker/portfolios/:id'
}
