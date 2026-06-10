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
          message: error.response?.data?.message || error.message,
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
    return data;
  }

  async getAgent(id: string): Promise<Agent> {
    const { data } = await this.client.get(`/agents/${id}`);
    return data;
  }

  async createAgent(agent: Partial<Agent>): Promise<Agent> {
    const { data } = await this.client.post('/agents', agent);
    return data;
  }

  async updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
    const { data } = await this.client.patch(`/agents/${id}`, agent);
    return data;
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
    return data;
  }

  async getPortfolioValue(userAddress: string): Promise<{ totalValue: string; change24h: string }> {
    const { data } = await this.client.get(`/portfolio/${userAddress}/value`);
    return data;
  }

  // Inference
  async runInference(
    agentId: string,
    prompt: string,
    type: 'writing' | 'research' | 'governance' | 'butler'
  ): Promise<{ result: string; tokens: number }> {
    const { data } = await this.client.post('/inference/run', {
      agentId,
      prompt,
      type,
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
}

export const apiClient = new ApiClient();
