import { describe, expect, it } from 'vitest';
import {
  GeneratedQuestionsSchema,
  validateAndSanitizeAiOutput,
} from './generated-questions.schema.js';

describe('GeneratedQuestionsSchema (Zod Validation)', () => {
  const validPayload = {
    mcqs: [
      {
        question: 'What is the primary function of chlorophyll in photosynthesis?',
        options: [
          'Absorb light energy',
          'Release carbon dioxide',
          'Absorb water from soil',
          'Break down glucose',
        ],
        answer: 'Absorb light energy',
        explanation: 'Chlorophyll pigments absorb solar radiation primarily in blue and red wavelengths.',
        difficulty: 'medium',
      },
    ],
    cqs: [
      {
        stimulus: 'A student measured oxygen production from hydrilla exposed to varying light intensities.',
        questions: {
          a: 'Define photosynthesis.',
          b: 'Why does light intensity affect oxygen production?',
          c: 'Design a control setup for this experiment.',
          d: 'Evaluate what happens if temperature is raised to 70°C.',
        },
        difficulty: 'medium',
      },
    ],
  };

  it('should successfully validate a well-formed AI response', () => {
    const result = validateAndSanitizeAiOutput(validPayload, 1, 1);
    expect(result.mcqs).toHaveLength(1);
    expect(result.cqs).toHaveLength(1);
    expect(result.mcqs[0].options).toHaveLength(4);
    expect(result.mcqs[0].answer).toBe('Absorb light energy');
  });

  it('should throw an error if fewer MCQs are generated than requested', () => {
    expect(() => validateAndSanitizeAiOutput(validPayload, 3, 1)).toThrow(
      /AI generated 1 MCQs, but exactly 3 were requested/,
    );
  });

  it('should throw an error if fewer CQs are generated than requested', () => {
    expect(() => validateAndSanitizeAiOutput(validPayload, 1, 3)).toThrow(
      /AI generated 1 CQs, but exactly 3 were requested/,
    );
  });

  it('should reject MCQs that do not have exactly 4 options', () => {
    const invalidPayload = {
      mcqs: [
        {
          question: 'Invalid MCQ with 3 options',
          options: ['Option 1', 'Option 2', 'Option 3'],
          answer: 'Option 1',
          explanation: 'Only three options provided.',
          difficulty: 'easy',
        },
      ],
      cqs: [],
    };

    expect(() => validateAndSanitizeAiOutput(invalidPayload, 1, 0)).toThrow(
      /Every MCQ must have exactly 4 options/,
    );
  });

  it('should reject CQs missing sub-questions a, b, c, or d', () => {
    const invalidPayload = {
      mcqs: [],
      cqs: [
        {
          stimulus: 'Some stimulus scenario',
          questions: {
            a: 'Question a',
            b: 'Question b',
            // Missing c and d
          },
          difficulty: 'hard',
        },
      ],
    };

    expect(() => validateAndSanitizeAiOutput(invalidPayload, 0, 1)).toThrow(
      /cqs\.0\.questions\.c/,
    );
  });

  it('should normalize letter answers (e.g. "A" -> Option text)', () => {
    const payloadWithLetterAnswer = {
      mcqs: [
        {
          question: 'Sample question?',
          options: ['Option Alpha', 'Option Beta', 'Option Gamma', 'Option Delta'],
          answer: 'B',
          explanation: 'Explanation text.',
          difficulty: 'easy',
        },
      ],
      cqs: [],
    };

    const validated = validateAndSanitizeAiOutput(payloadWithLetterAnswer, 1, 0);
    expect(validated.mcqs[0].answer).toBe('Option Beta');
  });
});
