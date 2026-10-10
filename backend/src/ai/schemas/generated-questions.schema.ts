import { z } from 'zod';

export const McqItemSchema = z.object({
  question: z.string().min(3, 'Question text must be at least 3 characters long'),
  options: z
    .array(z.string().min(1, 'Option cannot be empty'))
    .length(4, 'Every MCQ must have exactly 4 options'),
  answer: z.string().min(1, 'Answer cannot be empty'),
  explanation: z.string().min(3, 'Explanation must be at least 3 characters long'),
  difficulty: z.string().default('medium'),
});

export const CqItemSchema = z.object({
  stimulus: z.string().min(5, 'Stimulus must be at least 5 characters long'),
  questions: z.object({
    a: z.string().min(2, 'Sub-question a is required'),
    b: z.string().min(2, 'Sub-question b is required'),
    c: z.string().min(2, 'Sub-question c is required'),
    d: z.string().min(2, 'Sub-question d is required'),
  }),
  difficulty: z.string().default('medium'),
});

export const GeneratedQuestionsSchema = z.object({
  mcqs: z.array(McqItemSchema),
  cqs: z.array(CqItemSchema),
});

export type ValidatedMcqItem = z.infer<typeof McqItemSchema>;
export type ValidatedCqItem = z.infer<typeof CqItemSchema>;
export type ValidatedQuestionsOutput = z.infer<typeof GeneratedQuestionsSchema>;

/**
 * Validates the raw AI response against Zod schema and enforces exact requested counts.
 */
export function validateAndSanitizeAiOutput(
  rawJson: any,
  expectedMcqCount: number,
  expectedCqCount: number,
): ValidatedQuestionsOutput {
  // 1. Zod structural validation
  const parseResult = GeneratedQuestionsSchema.safeParse(rawJson);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`AI generated response failed structural validation: ${errorDetails}`);
  }

  const { mcqs, cqs } = parseResult.data;

  // 2. Validate MCQ count
  if (expectedMcqCount > 0 && mcqs.length < expectedMcqCount) {
    throw new Error(
      `AI generated ${mcqs.length} MCQs, but exactly ${expectedMcqCount} were requested.`,
    );
  }

  // 3. Validate CQ count
  if (expectedCqCount > 0 && cqs.length < expectedCqCount) {
    throw new Error(
      `AI generated ${cqs.length} CQs, but exactly ${expectedCqCount} were requested.`,
    );
  }

  // Slice to exact count if AI generated extra
  const finalMcqs = expectedMcqCount > 0 ? mcqs.slice(0, expectedMcqCount) : [];
  const finalCqs = expectedCqCount > 0 ? cqs.slice(0, expectedCqCount) : [];

  // 4. Ensure each MCQ answer matches one of its options
  for (let i = 0; i < finalMcqs.length; i++) {
    const mcq = finalMcqs[i];
    const match = mcq.options.find(
      (opt) =>
        opt.trim().toLowerCase() === mcq.answer.trim().toLowerCase() ||
        mcq.answer.trim().startsWith(opt.trim().slice(0, 2)),
    );
    if (!match) {
      // If answer is "A" or "Option A", set the corresponding option
      const letterIndex = ['A', 'B', 'C', 'D'].indexOf(mcq.answer.trim().toUpperCase());
      if (letterIndex >= 0 && mcq.options[letterIndex]) {
        mcq.answer = mcq.options[letterIndex];
      }
    }
  }

  return {
    mcqs: finalMcqs,
    cqs: finalCqs,
  };
}
