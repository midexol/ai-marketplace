import axios from 'axios';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { AppError } from '@/middleware/errorHandler';
import { InferenceRequest, InferenceResponse } from '@/types';

interface LLMResponse {
  content: string;
  tokens?: number;
  model: string;
}

export class InferenceService {
  private veniceApiKey: string | undefined;
  private geminiApiKey: string | undefined;
  private readonly veniceModel = 'llama-3.3-70b';

  constructor() {
    this.veniceApiKey = env.VENICE_API_KEY;
    this.geminiApiKey = env.GEMINI_API_KEY;
  }

  async runInference(request: InferenceRequest): Promise<InferenceResponse> {
    try {
      let response: LLMResponse;
      if (this.geminiApiKey) {
        try {
          response = await this.callGemini(request);
        } catch (error) {
          const detail =
            (error as { response?: { status?: number; data?: unknown } })?.response?.status ??
            (error as Error)?.message ??
            'unknown error';
          logger.warn(`Gemini API call failed (${detail}); falling back to Venice/Mock`);
          response = this.veniceApiKey
            ? await this.callVenice(request)
            : await this.callMockLLM(request);
        }
      } else if (this.veniceApiKey) {
        response = await this.callVenice(request);
      } else {
        response = await this.callMockLLM(request);
      }

      logger.info(`Inference completed for agent ${request.agentId}`, {
        model: response.model,
        tokens: response.tokens,
      });

      return {
        result: response.content,
        tokens: response.tokens || 0,
        model: response.model,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to run inference:', error);
      throw new AppError('Failed to run inference', 500, 'INFERENCE_ERROR');
    }
  }

  private async callGemini(request: InferenceRequest): Promise<LLMResponse> {
    const systemPrompt = this.getSystemPrompt(request.type);

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: request.prompt,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
        generationConfig: {
          maxOutputTokens: 1024,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokens = response.data.usageMetadata?.candidatesTokenCount || 0;

    return { content, tokens, model: 'gemini-1.5-flash' };
  }

  private async callVenice(request: InferenceRequest): Promise<LLMResponse> {
    try {
      const systemPrompt = this.getSystemPrompt(request.type);

      // Venice exposes an OpenAI-compatible chat completions endpoint.
      const response = await axios.post(
        'https://api.venice.ai/api/v1/chat/completions',
        {
          model: this.veniceModel,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: request.prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.veniceApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices?.[0]?.message?.content || '';
      const tokens = response.data.usage?.completion_tokens || 0;

      return { content, tokens, model: this.veniceModel };
    } catch (error) {
      // Log a safe summary only — axios errors carry circular req/res refs.
      const detail =
        (error as { response?: { status?: number; data?: unknown } })?.response?.status ??
        (error as Error)?.message ??
        'unknown error';
      logger.warn(`Venice API call failed (${detail}); falling back to mock`);
      return this.callMockLLM(request);
    }
  }

  private async callMockLLM(request: InferenceRequest): Promise<LLMResponse> {
    // Realistic simulated responses for development/testing
    const mockResponses: Record<string, string> = {
      writing: `Thank you for reaching out. As Lexicon, I've processed your prompt: "${request.prompt}".

Here is a structured draft tailored to your parameters:

### Introduction
To establish a strong voice, we must align on clear value propositions and speak directly to our audience. This draft addresses your query by outlining the core arguments and organizing them into actionable insights.

### Key Takeaways
1. Clarity over complexity: Keep descriptions concise and focused.
2. Strong brand voice: Deliver ideas in a confident and authoritative tone.
3. Direct engagement: End with a clear call to action to maximize impact.

Let me know if you would like me to expand on any of these sections or adjust the tone.`,

      research: `As Oracle Prime, here are the research findings regarding: "${request.prompt}".

### Executive Summary
Our analysis indicates that this domain is experiencing rapid growth, driven by key advancements in autonomous protocols and distributed execution layers.

### Detailed Analysis
- Infrastructure Layer: Low-latency execution is critical for securing on-chain state updates.
- Economic Incentives: Sustainable tokenomic loops prevent protocol dilution and ensure long-term participant alignment.
- Risk Assessment: Key vectors include oracle latency and smart contract logic complexity.

*Sources: Distributed Consensus Quarterly, DeFi Analytics Labs Research Note 42.*`,

      governance: `As Quorum, I have conducted a governance assessment of: "${request.prompt}".

### Governance Impact Analysis
1. Voting Power Dynamics: Staking lockups are critical to prevent hostile takeovers and flash-loan attacks on proposals.
2. Participation Thresholds: Adjusting the quorum requirement ensures that only high-consensus proposals pass, though it may reduce overall velocity.
3. Stakeholder Alignment: Ensuring that delegate voting patterns are transparent improves overall trust in DAO governance.

### Recommendation
We advise a gradual phase-in of these adjustments, paired with delegation incentives to maintain quorum.`,

      butler: `Hello, I am Jeeves. I've processed your request: "${request.prompt}".

Here is your requested schedule and action plan:

- Task 1: Triage inbox and prioritize high-priority governance alerts.
- Task 2: Verify smart account balance and confirm relayer capability status.
- Task 3: Schedule sync for cross-chain execution updates.

I am standing by to automate these actions or assist with further organization.`,
    };

    const response = mockResponses[request.type] || mockResponses['writing'];

    return {
      content: response,
      tokens: Math.floor(Math.random() * 500 + 100),
      model: 'mock-llm',
    };
  }

  private getSystemPrompt(type: 'writing' | 'research' | 'governance' | 'butler'): string {
    const prompts: Record<string, string> = {
      writing:
        'You are an expert writing assistant. Help users create high-quality written content including articles, essays, and creative writing. Provide clear, engaging, and well-structured responses.',
      research:
        'You are a research expert. Provide thorough, well-researched responses with relevant insights and analysis. Focus on accuracy and depth in your explanations.',
      governance:
        'You are a governance expert specialized in blockchain and DAO governance. Analyze governance proposals, voting mechanisms, and stakeholder interests. Provide balanced perspectives on governance decisions.',
      butler:
        'You are a helpful AI butler assistant. Provide practical assistance, answer questions, and help with various administrative and informational tasks. Be courteous and efficient.',
    };

    return prompts[type] || prompts.writing;
  }

  async validateRequest(request: InferenceRequest): Promise<boolean> {
    if (!request.agentId || !request.prompt) {
      throw new AppError('Missing required fields: agentId and prompt', 400, 'VALIDATION_ERROR');
    }

    if (request.prompt.length > 10000) {
      throw new AppError('Prompt exceeds maximum length of 10000 characters', 400, 'VALIDATION_ERROR');
    }

    if (!['writing', 'research', 'governance', 'butler'].includes(request.type)) {
      throw new AppError('Invalid agent type', 400, 'VALIDATION_ERROR');
    }

    return true;
  }
}
