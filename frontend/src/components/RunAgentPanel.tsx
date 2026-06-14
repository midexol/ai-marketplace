'use client';

import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/services/api';
import type { AgentType } from '@/types';
import { Sparkles, Loader2, AlertCircle, Cpu, Send, User, Bot } from 'lucide-react';
import { useAuth } from '@/providers/WalletProvider';
import { getAddress } from 'viem';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
}

function getWelcomeMessage(name: string, type: AgentType): string {
  const welcomes: Record<AgentType, string> = {
    writing: `Hello! I am ${name}, your writing assistant. How can I help you draft, review, or refine your content today?`,
    research: `Greetings. I am ${name}, specialized in deep research and analysis. Share your query, and I will compile structured findings.`,
    governance: `Hello, I am ${name}. I analyze DAO proposals, voting models, and governance trends. What proposal or mechanism shall we assess?`,
    butler: `At your service. I am ${name}, your AI butler. Let me know what tasks, calendar coordination, or on-chain checks you need help with.`,
  };
  return welcomes[type] || welcomes.writing;
}

export function RunAgentPanel({
  agentId,
  agentName,
  agentType,
  creatorAddress,
}: {
  agentId: string;
  agentName: string;
  agentType: AgentType;
  creatorAddress?: string;
}) {
  const { smartAccount, signerAccount } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'agent',
        text: getWelcomeMessage(agentName, agentType),
        timestamp: new Date(),
      },
    ]);
  }, [agentName, agentType]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, statusMessage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!smartAccount || !signerAccount) {
      setError('Connect your wallet first to authorize the payment for this request.');
      return;
    }

    const userPrompt = prompt;
    setPrompt('');
    setError(null);

    // Add user message to list
    const userMessageId = 'user-' + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        sender: 'user',
        text: userPrompt,
        timestamp: new Date(),
      },
    ]);

    setIsLoading(true);
    setStatusMessage('Preparing payment signature…');

    try {
      const toAddress = getAddress(creatorAddress || '0x27288C84887ED7Aa6Ad47948Df0908E6ce4A0053');
      const nonce = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const validAfter = 0;
      const validBefore = Math.floor(Date.now() / 1000) + 300; // 5 mins

      const domain = {
        name: 'USD Coin',
        version: '2',
        chainId: 84532,
        verifyingContract: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
      } as const;

      const types = {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      } as const;

      const message = {
        from: smartAccount.address as `0x${string}`,
        to: toAddress as `0x${string}`,
        value: 20000n, // 0.02 USDC
        validAfter: BigInt(validAfter),
        validBefore: BigInt(validBefore),
        nonce: nonce as `0x${string}`,
      } as const;

      setStatusMessage('Please sign the micro-payment in your wallet…');

      const signature = await signerAccount.signTypedData({
        domain,
        types,
        primaryType: 'TransferWithAuthorization',
        message,
      });

      setStatusMessage('Sending query & settling payment…');

      const payment = {
        signature,
        from: smartAccount.address,
        to: toAddress,
        value: '20000',
        nonce,
        validAfter,
        validBefore,
        tokenAddress: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
        chainId: 84532,
      };

      const res = await apiClient.runInference(agentId, userPrompt, agentType, payment);
      
      setMessages((prev) => [
        ...prev,
        {
          id: 'agent-' + Date.now(),
          sender: 'agent',
          text: res.result,
          timestamp: new Date(),
          model: (res as any).model || 'mock-llm',
          tokens: (res as any).tokens || 0,
        },
      ]);
    } catch (err: any) {
      console.error('Inference failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to run the agent');
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="card flex flex-col h-[550px] p-0 overflow-hidden border-[#38260f]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#38260f] bg-[#1d140a] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-[#ffb640] to-[#f59e1b]">
            <Bot className="h-4 w-4 text-[#211100]" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-white">{agentName} Terminal</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Online</span>
            </div>
          </div>
        </div>
        <span className="chip capitalize text-xs text-cyan-300 bg-[#30200c] border-[#ffb640]/20">{agentType}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#0d0a05] px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                msg.sender === 'user'
                  ? 'bg-cyan-600/30 text-cyan-300'
                  : 'bg-amber-600/20 text-amber-300 border border-[#ffb640]/20'
              }`}
            >
              {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>

            {/* Bubble */}
            <div className="space-y-1">
              <div
                className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600/20 text-white border border-cyan-500/30 rounded-tr-none'
                    : 'bg-[#18130c] text-slate-200 border border-[#30200c] rounded-tl-none shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
                }`}
              >
                {msg.text}
              </div>

              {/* Message metadata */}
              {msg.sender === 'agent' && (msg.model || msg.tokens) && (
                <div className="flex items-center gap-1.5 px-1 font-mono text-[9px] text-slate-500">
                  <Cpu className="h-2.5 w-2.5" />
                  <span>{msg.model}</span>
                  {typeof msg.tokens === 'number' && msg.tokens > 0 && (
                    <span>· {msg.tokens} tokens</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing / Loading Indicators */}
        {isLoading && (
          <div className="flex items-start gap-2.5 max-w-[85%]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-600/20 text-amber-300 border border-[#ffb640]/20">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="rounded-2xl rounded-tl-none bg-[#18130c] border border-[#30200c] px-3.5 py-2 text-xs italic text-slate-400 flex items-center gap-2">
                <span>{statusMessage || 'Thinking…'}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer input form */}
      <form
        onSubmit={handleSend}
        className="border-t border-[#38260f] bg-[#130f08] p-3 flex flex-col gap-2"
      >
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={`Message ${agentName}…`}
            className="flex-1 rounded-lg border border-[#493113] bg-[#0d0a05] px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-clay-600 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ffb640] to-[#f59e1b] hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:scale-100 transition"
          >
            <Send className="h-4 w-4 text-[#211100]" />
          </button>
        </div>
      </form>
    </div>
  );
}
