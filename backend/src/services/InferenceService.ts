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
    // Mock implementation for development/testing
    const mockResponses: Record<string, string> = {
      writing: `I've analyzed your request and composed a response. This is a mock response for the "${request.agentId}" writing agent. The prompt you provided was: "${request.prompt}". In a production environment, this would be replaced with actual LLM output from Venice.`,
      research: `Research findings: Based on your query about "${request.prompt}", here are some insights. This mock research agent would provide detailed analysis and citations in production.`,
      governance: `Governance analysis: For the proposal "${request.prompt}", here's my assessment of the governance implications. A production governance agent would analyze on-chain voting patterns and stakeholder positions.`,
      butler: `Butler response: I'm ready to assist with "${request.prompt}". This mock butler agent would handle various administrative tasks and queries in production.`,
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
