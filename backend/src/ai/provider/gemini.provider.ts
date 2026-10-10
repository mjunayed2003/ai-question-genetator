import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { AIProvider, GenerateQuestionsInput } from '../interface/ai-provider.interface.js';
import { QuestionPromptBuilder } from '../prompts/question-prompt.builder.js';

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

const QUESTIONS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    mcqs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: {
            type: 'array',
            items: { type: 'string' },
          },
          answer: { type: 'string' },
          explanation: { type: 'string' },
          difficulty: { type: 'string' },
        },
        required: ['question', 'options', 'answer', 'explanation', 'difficulty'],
      },
    },
    cqs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stimulus: { type: 'string' },
          questions: {
            type: 'object',
            properties: {
              a: { type: 'string' },
              b: { type: 'string' },
              c: { type: 'string' },
              d: { type: 'string' },
            },
            required: ['a', 'b', 'c', 'd'],
          },
          difficulty: { type: 'string' },
        },
        required: ['stimulus', 'questions', 'difficulty'],
      },
    },
  },
  required: ['mcqs', 'cqs'],
};

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly ai: GoogleGenAI;
  private readonly modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
    this.modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  }

  async generateQuestions(input: GenerateQuestionsInput): Promise<any> {
    const prompt = QuestionPromptBuilder.buildGenerationPrompt({
      topic: input.topic,
      sourceText: input.sourceText,
      mcqCount: input.mcqCount,
      cqCount: input.cqCount,
      language: input.language,
      difficulty: input.difficulty,
    });

    return this.executeWithRetry(prompt, QUESTIONS_JSON_SCHEMA);
  }

  async generateContent(prompt: string, schema: any = QUESTIONS_JSON_SCHEMA): Promise<any> {
    return this.executeWithRetry(prompt, schema);
  }

  private async executeWithRetry(prompt: string, schema: any, maxRetries = 1): Promise<any> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        if (!response.text) {
          throw new InternalServerErrorException('Gemini returned an empty response.');
        }

        return JSON.parse(response.text);
      } catch (err: any) {
        lastError = err;
        const status = err.status || (err.error && err.error.code);
        this.logger.warn(`Gemini attempt ${attempt + 1} failed (status: ${status}): ${err.message}`);

        // If 503 high demand or 429 rate limit, wait briefly before single retry
        if ((status === 503 || status === 429) && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        break;
      }
    }

    // Map error to proper NestJS HTTP exception
    const statusCode = lastError.status || (lastError.error && lastError.error.code);
    if (statusCode === 503) {
      throw new ServiceUnavailableException(
        'Gemini AI is currently experiencing high demand. Please try again shortly.',
      );
    }
    if (statusCode === 429) {
      throw new ServiceUnavailableException('Gemini AI rate limit exceeded. Please try again in a moment.');
    }
    if (statusCode === 401 || statusCode === 403) {
      throw new BadGatewayException('Gemini API authentication failed. Please check your GEMINI_API_KEY.');
    }

    throw new InternalServerErrorException(
      `AI generation failed: ${lastError.message || 'Unknown error from Gemini'}`,
    );
  }
}