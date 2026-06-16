import axios, { AxiosInstance } from 'axios';
import { Agent, Trade, Portfolio, PaginatedResponse, ApiError } from '@/types';

/**
 * Normalizes NEXT_PUBLIC_API_URL into a base ending in exactly one `/api`.
 * Accepts either the bare origin ("https://host.com") or one already
 * including the suffix ("https://host.com/api") — both resolve identically.
 */
function resolveApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const trimmed = raw.replace(/\/+$/, '').replace(/\/api$/, '');
  return `${trimmed}/api`;
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRecord(value: unknown): Record<string, string> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, string>)
    : {};
}

function normalizeAgent(agent: Partial<Agent> | null | undefined): Agent {
  const safeAgent = agent || {};

  return {
    ...safeAgent,
    id: safeAgent.id || '',
    name: safeAgent.name || 'Untitled Agent',
    description: safeAgent.description || '',
    creatorAddress: safeAgent.creatorAddress || '',
    type: safeAgent.type || 'writing',
    chains: normalizeStringArray(safeAgent.chains),
    tokenAddresses: normalizeRecord(safeAgent.tokenAddresses),
    createdAt: safeAgent.createdAt || new Date(),
    updatedAt: safeAgent.updatedAt || new Date(),
  };
}

function normalizePaginatedAgents(response: PaginatedResponse<Agent>): PaginatedResponse<Agent> {
  return {
    ...response,
    data: Array.isArray(response.data) ? response.data.map(normalizeAgent).filter((agent) => agent.id) : [],
  };
}

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: resolveApiBase(),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const apiError: ApiError = {
          code: error.response?.data?.code || 'UNKNOWN_ERROR',
          message: error.response?.data?.message || error.response?.data?.error || error.message,
          status: error.response?.status || 500,
        };
        return Promise.reject(apiError);
      }
    );
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  // Agents
  async getAgents(page = 1, limit = 20): Promise<PaginatedResponse<Agent>> {
    const { data } = await this.client.get('/agents', { params: { page, limit } });
    return normalizePaginatedAgents(data);
  }

  async getAgent(id: string): Promise<Agent> {
    const { data } = await this.client.get(`/agents/${id}`);
    return normalizeAgent(data);
  }

  async createAgent(agent: Partial<Agent>): Promise<Agent> {
    const { data } = await this.client.post('/agents', agent);
    return normalizeAgent(data);
  }

  async updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
    const { data } = await this.client.patch(`/agents/${id}`, agent);
    return normalizeAgent(data);
  }

  // Marketplace
  async getTrades(agentId: string, page = 1, limit = 20): Promise<PaginatedResponse<Trade>> {
    const { data } = await this.client.get(`/marketplace/trades/${agentId}`, {
      params: { page, limit },
    });
    return data;
  }

  async getMarketPrice(agentId: string, chain: string): Promise<{ price: string; change24h: string }> {
    const { data } = await this.client.get(`/marketplace/price/${agentId}`, { params: { chain } });
    return data;
  }

  async executeTrade(params: {
    agentId: string;
    amount: string;
    price: string;
    chain: string;
    type: 'buy' | 'sell';
  }): Promise<{ txHash: string; tradeId: string }> {
    const { data } = await this.client.post('/marketplace/trade', params);
    return data;
  }

  async approveToken(tokenAddress: string, amount: string): Promise<{ txHash: string }> {
    const { data } = await this.client.post('/marketplace/approve', {
      tokenAddress,
      amount,
    });
    return data;
  }

  // User profile — used to detect returning users + render the profile page.
  async getUserProfile(
    address: string
  ): Promise<{
    address: string;
    username?: string;
    bio?: string;
    profileImage?: string;
    metadata?: Record<string, any>;
  } | null> {
    try {
      const { data } = await this.client.get(`/portfolio/user/${address}`);
      return data;
    } catch {
      return null;
    }
  }

  // Update editable profile fields (username, bio, optional image URL).
  async updateUserProfile(
    address: string,
    fields: { username?: string; bio?: string; profileImage?: string }
  ): Promise<{ success: boolean }> {
    const { data } = await this.client.patch(`/portfolio/user/${address}`, fields);
    return data;
  }

  // User preferences
  async saveUserPreferences(
    address: string,
    interests: string[],
    chains: string[]
  ): Promise<{ success: boolean }> {
    const { data } = await this.client.patch(`/portfolio/user/${address}`, {
      metadata: { interests, chains },
    });
    return data;
  }

  // Portfolio
  async getPortfolio(userAddress: string): Promise<Portfolio[]> {
    const { data } = await this.client.get(`/portfolio/${userAddress}`);
    const holdings = Array.isArray(data)
      ? data
      : (data && typeof data === 'object' && 'holdings' in data && Array.isArray((data as any).holdings))
        ? (data as any).holdings
        : [];

    return holdings.map((h: any) => ({
      id: h.id || h.agentId,
      userAddress: userAddress,
      agentId: h.agentId,
      chain: h.chain,
      balance: h.balance || '0',
      price: h.currentPrice || '0',
      percentageChange: String(h.gainLossPercentage || '0'),
      agent: {
        id: h.agentId,
        name: h.agentName || 'Unknown Agent',
        description: '',
        creatorAddress: '',
        type: 'writing',
        tokenAddresses: {},
        chains: [h.chain],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      updatedAt: new Date(),
    }));
  }

  async getPortfolioValue(userAddress: string): Promise<{ totalValue: string; change24h: string }> {
    const { data } = await this.client.get(`/portfolio/${userAddress}/value`);
    return data;
  }

  // Inference
  async runInference(
    agentId: string,
    prompt: string,
    type: 'writing' | 'research' | 'governance' | 'butler',
    payment?: any
  ): Promise<{ result: string; tokens: number }> {
    const { data } = await this.client.post('/inference/run', {
      agentId,
      prompt,
      type,
      payment,
    });
    return data;
  }

  // Governance
  async getGovernanceProposals(page = 1, limit = 10): Promise<PaginatedResponse<any>> {
    const { data } = await this.client.get('/governance/proposals', { params: { page, limit } });
    return data;
  }

  async getVotingPower(userAddress: string): Promise<{ power: string; veVIRTUAL: string }> {
    const { data } = await this.client.get(`/governance/voting-power/${userAddress}`);
    return data;
  }

  async voteOnProposal(proposalId: string, voteType: 'for' | 'against'): Promise<any> {
    const { data } = await this.client.post(`/governance/proposals/${proposalId}/vote`, {
      voteType,
    });
    return data;
  }

  async createProposal(proposal: any): Promise<any> {
    const { data } = await this.client.post('/governance/proposals', proposal);
    return data;
  }

  // Faucet
  async claimFaucet(userAddress: string): Promise<{ success: boolean; hash: string }> {
    const { data } = await this.client.post('/portfolio/faucet', { userAddress });
    return data;
  }

  // Reputation & Planning
  async getReputation(agentId: string): Promise<{
    agentId: string;
    score: number;
    tier: 'Unverified' | 'Provisional' | 'Trusted' | 'Elite';
    totalStaked: string;
    disputes: number;
    successCount: number;
  }> {
    const { data } = await this.client.get(`/reputation/${agentId}`);
    return data;
  }

  async stakeReputation(agentId: string, amount: string): Promise<any> {
    const { data } = await this.client.post('/reputation/stake', { agentId, amount });
    return data;
  }

  async reportMisbehavior(agentId: string): Promise<any> {
    const { data } = await this.client.post('/reputation/report', { agentId });
    return data;
  }

  async generatePlan(params: {
    goal: string;
    agentType: 'writing' | 'research' | 'governance' | 'butler';
    spendingLimit: number;
    allowedTargets: string[];
  }): Promise<any> {
    const { data } = await this.client.post('/reputation/plan', params);
    return data;
  }
}

export const apiClient = new ApiClient();
