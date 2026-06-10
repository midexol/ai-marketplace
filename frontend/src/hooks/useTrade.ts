import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

export interface ExecuteTradeParams {
  agentId: string;
  amount: string;
  price: string;
  chain: string;
  type: 'buy' | 'sell';
}

export function useExecuteTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ExecuteTradeParams) => apiClient.executeTrade(params),
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries after successful trade
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trades', variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ['marketPrice'] });
    },
  });
}

export function useApproveToken(tokenAddress: string) {
  return useMutation({
    mutationFn: (amount: string) =>
      apiClient.approveToken(tokenAddress, amount),
  });
}
