import { GenerateQuestionsDto } from '../dto/generate-questions.dto.js';

export interface GenerateQuestionsInput extends GenerateQuestionsDto {
  sourceText?: string;
}

export interface AIProvider {
  generateQuestions(input: GenerateQuestionsInput): Promise<any>;
  generateContent?(prompt: string, schema?: any): Promise<any>;
}

export const AI_PROVIDER = 'AI_PROVIDER';