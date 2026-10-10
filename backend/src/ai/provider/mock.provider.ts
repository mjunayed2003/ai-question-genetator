import { Injectable } from '@nestjs/common';
import { AIProvider, GenerateQuestionsInput } from '../interface/ai-provider.interface.js';

@Injectable()
export class MockProvider implements AIProvider {
  async generateQuestions(input: GenerateQuestionsInput) {
    const mcqs = Array.from({ length: input.mcqCount || 1 }).map((_, i) => ({
      question: `Sample MCQ ${i + 1} about ${input.topic || 'the topic'}?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 'Option A',
      explanation: 'Detailed explanation for sample question.',
      difficulty: input.difficulty || 'medium',
    }));

    const cqs = Array.from({ length: input.cqCount || 0 }).map((_, i) => ({
      stimulus: `Sample scenario stimulus ${i + 1} regarding ${input.topic || 'the subject'}.`,
      questions: {
        a: 'State the core definition.',
        b: 'Explain the primary mechanism.',
        c: 'Apply this concept to the scenario.',
        d: 'Evaluate the resulting outcome.',
      },
      difficulty: input.difficulty || 'medium',
    }));

    return { mcqs, cqs };
  }

  async generateContent(prompt: string) {
    if (prompt.includes('MCQ')) {
      return {
        mcqs: [
          {
            question: 'Sample regenerated MCQ?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            answer: 'Option A',
            explanation: 'Sample regenerated explanation.',
            difficulty: 'medium',
          },
        ],
        cqs: [],
      };
    }
    return {
      mcqs: [],
      cqs: [
        {
          stimulus: 'Sample regenerated stimulus scenario.',
          questions: {
            a: 'Regenerated question a.',
            b: 'Regenerated question b.',
            c: 'Regenerated question c.',
            d: 'Regenerated question d.',
          },
          difficulty: 'medium',
        },
      ],
    };
  }
}