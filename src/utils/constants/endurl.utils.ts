// Endurl constants

export const ENDURL = {
  // server status
  GET_SERVER_STATUS: 'ticker/admin/server-status',
  POST_SMART_LOGIN: 'ticker/admin/smart-login',

  // Raw Stock
  GET_RAW_STOCKS: 'ticker/admin/raw-stocks',
  GET_RAW_STOCK_BY_ID: 'ticker/admin/raw-stock/:id',
  POST_RAW_STOCK: 'ticker/admin/raw-stock',
  GET_STOCK_UNIVERSE_AUDIT: 'ticker/admin/stock-universe-audit',
  MARK_STOCK_UNIVERSE_INACTIVE: 'ticker/admin/stock-universe-audit/mark-inactive',
  MARK_STOCK_UNIVERSE_ROW_INACTIVE: 'ticker/admin/stock-universe-audit/mark-row-inactive',
  ADD_STOCK_FROM_AUDIT: 'ticker/admin/stock-universe-audit/add-stock',
  ADD_STOCKS_FROM_AUDIT: 'ticker/admin/stock-universe-audit/add-stocks',
  POST_RAW_STOCK_STATUS: 'ticker/master/create',
  POST_RAW_STOCK_PRICE: 'ticker/admin/raw-stock-price',

  // Stock Endpoints
  GET_ALL_ACTIVE_STOCKS: 'ticker/activestock',
  GET_STOCK_BY_SYMBOL: 'ticker/stocks/symbol/:symbol',
  GET_STOCK_BY_ID: 'ticker/stocks/:id',

  // Historical Universe / Backtesting Phase 1
  GET_HISTORICAL_UNIVERSE_RULES: 'ticker/historical-universe/rules',
  POST_HISTORICAL_UNIVERSE_FILTER: 'ticker/historical-universe/filter',

  // Stock Fundamental
  Fetch_STOCK_FUNDAMENTAL: 'ticker/fundamentals/fetch',
  GET_STOCK_FUNDAMENTAL_DETAILS: 'ticker/fundamentals',
  GET_STOCK_FUNDAMENTAL_OVERVIEW_DETAILS: 'ticker/fundamentals/overview',
  GET_STOCK_FUNDAMENTAL_QUARTERLY_DETAILS: 'ticker/fundamentals/quarterly',
  GET_STOCK_FUNDAMENTAL_PROFIT_LOSS_DETAILS: 'ticker/fundamentals/profit-loss',
  GET_STOCK_FUNDAMENTAL_BALANCE_SHEET_DETAILS: 'ticker/fundamentals/balance-sheet',
  GET_STOCK_FUNDAMENTAL_CASH_FLOW_DETAILS: 'ticker/fundamentals/cash-flow',
  GET_STOCK_FUNDAMENTAL_RATIOS_DETAILS: 'ticker/fundamentals/ratios',
  GET_STOCK_FUNDAMENTAL_SHAREHOLDING_DETAILS: 'ticker/fundamentals/shareholding',
  GET_STOCK_DIVIDEND_ANALYSIS: 'ticker/fundamentals/analysis/dividend',
  GET_STOCK_DIVIDEND_ANALYSIS_BY_SYMBOL: 'ticker/fundamentals/analysis/dividend/:symbol',
  GET_STOCK_GROWTH_ANALYSIS: 'ticker/fundamentals/analysis/growth',
  GET_STOCK_GROWTH_ANALYSIS_BY_SYMBOL: 'ticker/fundamentals/analysis/growth/:symbol',
  GET_STOCK_GARP_ANALYSIS: 'ticker/fundamentals/analysis/garp',
  GET_STOCK_GARP_ANALYSIS_BY_SYMBOL: 'ticker/fundamentals/analysis/garp/:symbol',
  GET_STOCK_VALUE_ANALYSIS: 'ticker/fundamentals/analysis/value',
  GET_STOCK_VALUE_ANALYSIS_BY_SYMBOL: 'ticker/fundamentals/analysis/value/:symbol',
  GET_STOCK_PIVOT_ANALYSIS: 'ticker/fundamentals/analysis/pivot',
  GET_STOCK_PIVOT_ANALYSIS_BY_SYMBOL: 'ticker/fundamentals/analysis/pivot/:symbol',
  FUNDAMENTAL_SCHEMA_AUDIT: 'ticker/fundamentals/schema-audit',
  FUNDAMENTAL_SCHEMA_AUDIT_FINALIZE: 'ticker/fundamentals/schema-audit/finalize',

  // IPO GMP
  FETCH_IPO_GMP: 'ticker/ipo-gmp',

  // EOD
  FETCH_EOD_BY_RANGE_CHUNKED: 'ticker/eod/fetch-by-range-chunked',
  GET_EOD_MASTER_RANGE: 'ticker/eod/master',

  // Master Stock
  GET_MASTER_STOCKS: 'ticker/master',
  UPDATE_MASTER_TOKEN_EXCHANGE: 'ticker/master/:id/token-exchange',
  MARK_MASTER_STOCK_INACTIVE: 'ticker/master/:id/inactive',

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
  TRANSFER_WALLET_TO_PORTFOLIO: 'user/wallet/transfer-to-portfolio/:portfolioId',

  // Tax Planner
  USER_TAX_PLANNER_LIST: 'user/tax-planner',
  USER_TAX_PLANNER_ACTIVE: 'user/tax-planner/active',
  USER_TAX_PLANNER_ITEM: 'user/tax-planner/:planId',

  // TTS (Piper)
  GENERATE_TTS_AUDIO: 'user/tts/generate',

  // Ollama (Local LLM)
  OLLAMA_CHAT: 'user/ollama/chat',

  // Content Creator
  CONTENT_GENERATE_SCRIPT: 'user/content/generate-script',
  CONTENT_SPLIT_SCRIPT: 'user/content/split-script',
  CONTENT_GENERATE_SCENE_AUDIOS: 'user/content/generate-scene-audios',
  CONTENT_UPLOAD_SCENE_IMAGE: 'user/content/upload-image',
  CONTENT_RENDER_VIDEO: 'user/content/render-video',
  CONTENT_RENDER_STATUS: 'user/content/render-status/:jobId',

  // News Creator (isolated from Content Creator)
  NEWS_GENERATE_SCRIPT: 'content/news-content/generate-script',
  NEWS_CONVERT_SCRIPT_HINDI: 'content/news-content/convert-script-hindi',
  NEWS_CONVERT_SCRIPT_HINDI_GEMINI: 'content/news-content/convert-script-hindi-gemini',
  NEWS_SHORTEN_SCRIPT: 'content/news-content/shorten-script',
  NEWS_SPLIT_SCRIPT: 'content/news-content/split-script',
  NEWS_GENERATE_SCENE_AUDIOS: 'content/news-content/generate-scene-audios',
  NEWS_UPLOAD_SCENE_IMAGE: 'content/news-content/upload-image',
  NEWS_RENDER_VIDEO: 'content/news-content/render-video',
  NEWS_RENDER_STATUS: 'content/news-content/render-status/:jobId',
  NEWS_BSE_FETCH: 'content/news-content/bse/fetch',
  NEWS_BSE_LIST: 'content/news-content/bse/list',
  NEWS_BSE_CATEGORIES: 'content/news-content/bse/categories',
  NEWS_BSE_ITEM: 'content/news-content/bse/news/:id',
  NEWS_BSE_VIDEOS_CREATE: 'content/news-content/bse/videos',
  NEWS_BSE_VIDEOS_LIST: 'content/news-content/bse/videos',
  NEWS_NEW_APPROACH_SUMMARIZE: 'content/news-content/new-approach/summarize-by-news-id',
  NEWS_NEW_APPROACH_IMPORTANT: 'content/news-content/new-approach/important-points',
  NEWS_NEW_APPROACH_SCRIPT: 'content/news-content/new-approach/generate-script',
  NEWS_NEW_APPROACH_SCRIPT_AUDIO: 'content/news-content/new-approach/generate-script-audio',
  NEWS_NEW_APPROACH_HIGHLIGHT_TERMS: 'content/news-content/new-approach/extract-highlight-terms',
  NEWS_NEW_APPROACH_START_BATCH: 'content/news-content/new-approach/start-batch',
  NEWS_NEW_APPROACH_BATCH_STATUS: 'content/news-content/new-approach/batch-status/:jobId',
  NEWS_NEW_APPROACH_STOP_BATCH: 'content/news-content/new-approach/stop-batch/:jobId',

  NEWS_CONTENT_VIDEOS_LIST: 'content/news-content/videos',
  NEWS_CONTENT_VIDEOS_CREATE: 'content/news-content/videos',
  NEWS_CONTENT_VIDEOS_ITEM: 'content/news-content/videos/:id',
  NEWS_CONTENT_VIDEOS_UPDATE: 'content/news-content/videos/:id',
  NEWS_CONTENT_VIDEOS_UPLOAD_IMAGE: 'content/news-content/videos/:id/assets/image',
  NEWS_CONTENT_VIDEOS_UPLOAD_AUDIO: 'content/news-content/videos/:id/assets/audio',
  NEWS_CONTENT_VIDEOS_RENDER: 'content/news-content/videos/:id/render',
  NEWS_CONTENT_VIDEOS_RENDER_STATUS: 'content/news-content/videos/:id/render-status/:jobId',
  NEWS_CONTENT_VIDEOS_GENERATE_FFMPEG: 'content/news-content/ffmpeg/generate-video',
  NEWS_CONTENT_VIDEOS_GENERATE_REMOTION_PREVIEW: 'content/news-content/remotion-preview/generate-video',
  NEWS_CONTENT_VIDEOS_FAST_GPU_CREATE: 'content/news-content/v2/gpu-render/jobs',
  NEWS_CONTENT_VIDEOS_FAST_GPU_LIST: 'content/news-content/v2/gpu-render/jobs',
  NEWS_CONTENT_VIDEOS_FAST_GPU_ITEM: 'content/news-content/v2/gpu-render/jobs/:jobId',
  NEWS_CONTENT_VIDEOS_RENDER_STATUS_FFMPEG: 'content/news-content/videos/:id/render-status-ffmpeg/:jobId',
  NEWS_CONTENT_VIDEOS_RENDER_STATUS_REMOTION_PREVIEW: 'content/news-content/videos/:id/render-status-remotion-preview/:jobId',
  NEWS_CONTENT_VIDEOS_RENDERED: 'content/news-content/videos/rendered/:fileName',
  NEWS_CONTENT_VIDEOS_KEYWORD: 'content/news-content/videos/keyword',
  NEWS_AUDIO_TOOLS_PROCESS: 'content/news-content/audio-tools/process',
  NEWS_AUDIO_TOOLS_GENERATED: 'content/news-content/audio-tools/generated/:fileName',
  NEWS_AUDIO_TOOLS_PRESETS: 'content/news-content/audio-tools/presets',
  NEWS_AUDIO_TOOLS_SAVE_PRESET: 'content/news-content/audio-tools/presets',
  NEWS_AUDIO_TOOLS_PRESET_ITEM: 'content/news-content/audio-tools/presets/:id',
  NEWS_CONTENT_RSS: 'content/news-content/rss',
  NEWS_CONTENT_RSS_SAVE: 'content/news-content/rss/save',
  NEWS_CONTENT_RSS_ITEMS: 'content/news-content/rss/items',
  NEWS_CONTENT_RSS_ITEM_DRAFT: 'content/news-content/rss/items/:id/draft',
  NEWS_CONTENT_RSS_PROGRESS: 'content/news-content/rss/progress',
  NEWS_CONTENT_RSS_PROCESS_ONE: 'content/news-content/rss/process-one',
  NEWS_CONTENT_RSS_ARTICLE_BODY: 'content/news-content/rss/article-body',
  NEWS_CONTENT_RSS_LINK_VIDEO: 'content/news-content/rss/link-video',
  NEWS_CONTENT_RSS_IMPROVE_TEMPLATE: 'content/news-content/rss/improve-template',
  NEWS_CONTENT_RSS_TEMPLATE_PROMPTS: 'content/news-content/rss/template-prompts',
  NEWS_CONTENT_MUSIC_LIBRARY_CATEGORIES: 'content/news-content/music-library/categories',
  NEWS_CONTENT_MUSIC_LIBRARY_TRACKS: 'content/news-content/music-library/tracks',
  NEWS_CONTENT_MUSIC_LIBRARY_UPLOAD: 'content/news-content/music-library/tracks/upload',
  NEWS_CONTENT_MUSIC_LIBRARY_TRACK_UPDATE: 'content/news-content/music-library/tracks/:id',
  NEWS_CONTENT_MUSIC_LIBRARY_FILE: 'content/news-content/music-library/files/:fileName',
  SOCIAL_ACCOUNTS_SCHEMA: 'content/news-content/social-accounts/schema',
  SOCIAL_ACCOUNTS_LIST: 'content/news-content/social-accounts',
  SOCIAL_ACCOUNTS_ITEM: 'content/news-content/social-accounts/:platform',
  SOCIAL_ACCOUNTS_PUBLISH: 'content/news-content/social-accounts/:platform/publish',
  GET_STOCK_SEARCH_ANALYSIS: 'ticker/fundamentals/analysis/search',
  GET_STOCK_SEARCH_SUGGESTIONS: 'ticker/fundamentals/analysis/search/suggestions',
  POST_HISTORICAL_UNIVERSE_SEARCH: 'ticker/historical-universe/search',
  POST_HISTORICAL_UNIVERSE_SEARCH_SPLIT: 'ticker/historical-universe/search-split',
  NEWS_CONTENT_IMAGE_SEARCH: 'content/news-content/image-search'
}
