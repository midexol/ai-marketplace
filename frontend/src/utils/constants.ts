/**
 * Agent type definitions and metadata
 */
export const AGENT_TYPES = {
  writing: {
    label: 'Writing',
    description: 'Agents specialized in content generation and writing',
    color: 'purple',
    icon: 'PenLine',
  },
  research: {
    label: 'Research',
    description: 'Agents specialized in research and data analysis',
    color: 'blue',
    icon: 'FlaskConical',
  },
  governance: {
    label: 'Governance',
    description: 'Agents specialized in governance and voting',
    color: 'green',
    icon: 'Building2',
  },
  butler: {
    label: 'Butler',
    description: 'Agents specialized in task automation and assistance',
    color: 'orange',
    icon: 'Bot',
  },
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  AGENTS_PER_PAGE: 12,
  PROPOSALS_PER_PAGE: 10,
  TRADES_PER_PAGE: 20,
} as const;

/**
 * Cache durations (in milliseconds)
 */
export const CACHE_DURATION = {
  INSTANT: 0,
  SHORT: 1000 * 15, // 15 seconds
  MEDIUM: 1000 * 60, // 1 minute
  LONG: 1000 * 60 * 5, // 5 minutes
  VERY_LONG: 1000 * 60 * 30, // 30 minutes
} as const;

/**
 * Trading constraints
 */
export const TRADE_LIMITS = {
  MIN_AMOUNT: '0.0001',
  MAX_AMOUNT: '1000000',
  MIN_PRICE: '0.000001',
  MAX_PRICE: '1000000',
  SLIPPAGE_DEFAULT: 0.5, // 0.5%
  SLIPPAGE_HIGH: 2, // 2%
  GAS_BUFFER: 1.1, // 10% buffer
} as const;

/**
 * Governance constants
 */
export const GOVERNANCE = {
  MIN_VOTING_POWER: '100',
  MIN_PROPOSAL_STAKING: '10000',
  VOTING_PERIOD_DAYS: 7,
  QUORUM_PERCENTAGE: 40,
  APPROVAL_THRESHOLD: 50,
  LOCK_PERIOD_DAYS: 7,
  APY_PERCENTAGE: 8,
} as const;

/**
 * Status display values
 */
export const STATUS_DISPLAY = {
  active: { label: 'Active', color: 'blue', icon: 'CircleDot' },
  passed: { label: 'Passed', color: 'green', icon: 'Check' },
  failed: { label: 'Failed', color: 'red', icon: 'X' },
  pending: { label: 'Pending', color: 'yellow', icon: 'Clock' },
  completed: { label: 'Completed', color: 'gray', icon: 'Circle' },
} as const;

/**
 * Transaction types
 */
export const TRANSACTION_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
  STAKE: 'stake',
  UNSTAKE: 'unstake',
  VOTE: 'vote',
  CLAIM: 'claim',
} as const;

/**
 * Blockchain network info
 */
export const NETWORKS = {
  ethereum: { name: 'Ethereum', symbol: 'ETH', icon: 'ETH' },
  polygon: { name: 'Polygon', symbol: 'MATIC', icon: 'MATIC' },
  arbitrum: { name: 'Arbitrum', symbol: 'ARB', icon: 'ARB' },
  base: { name: 'Base', symbol: 'BASE', icon: 'BASE' },
} as const;

/**
 * URL paths
 */
export const ROUTES = {
  HOME: '/',
  MARKETPLACE: '/marketplace',
  AGENT: (id: string) => `/agent/${id}`,
  CREATE_AGENT: '/create-agent',
  PORTFOLIO: '/portfolio',
  GOVERNANCE: '/governance',
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  USER_ADDRESS: 'user_address',
  CHAIN_ID: 'chain_id',
  THEME: 'theme',
  LAST_VISITED: 'last_visited',
  FAVORITES: 'favorite_agents',
  PORTFOLIO_CACHE: 'portfolio_cache',
} as const;

/**
 * Feature flags
 */
export const FEATURES = {
  STAKING: true,
  GOVERNANCE: true,
  MULTI_CHAIN: true,
  ADVANCED_CHARTS: true,
  AI_RECOMMENDATIONS: false,
  PORTFOLIO_ANALYTICS: true,
} as const;

/**
 * Default filter values
 */
export const DEFAULT_FILTERS = {
  AGENT_TYPE: 'all',
  CHAIN: 'all',
  SORT_BY: 'name',
  SEARCH_QUERY: '',
} as const;
