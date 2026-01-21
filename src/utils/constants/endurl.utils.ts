// Endurl constants

export const ENDURL = {
  // server status
  GET_SERVER_STATUS: '/admin/server-status',
  POST_SMART_LOGIN: '/admin/smart-login',

  // Raw Stock
  GET_RAW_STOCKS: 'admin/raw-stocks',
  GET_RAW_STOCK_BY_ID: 'admin/raw-stock/:id',
  POST_RAW_STOCK: 'admin/raw-stock',
  POST_RAW_STOCK_STATUS: 'master/create',
  POST_RAW_STOCK_PRICE: 'admin/raw-stock-price',

  // Stock Endpoints
  GET_ALL_ACTIVE_STOCKS: '/activestock',
  GET_STOCK_BY_SYMBOL: '/stocks/symbol/:symbol',
  GET_STOCK_BY_ID: '/stocks/:id'
}
