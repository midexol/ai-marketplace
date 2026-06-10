export type AgentType = 'writing' | 'research' | 'governance' | 'butler';

export interface Agent {
  id: string;
  name: string;
  description: string;
  creatorAddress: string;
  type: AgentType;
  avatarUrl?: string;
  tokenAddresses: Record<string, string>; // chainId -> contract address
  chains: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentToken {
  id: string;
  agentId: string;
  chain: string;
  contractAddress: string;
  totalSupply: string;
  price: string;
  marketCap: string;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  agentId: string;
  buyer: string;
  seller: string;
  amount: string;
  price: string;
  chain: string;
  txHash: string;
  createdAt: Date;
}

export interface Portfolio {
  id: string;
  userAddress: string;
  agentId: string;
  chain: string;
  balance: string;
  updatedAt: Date;
}

export interface User {
  id: string;
  walletAddress: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}
