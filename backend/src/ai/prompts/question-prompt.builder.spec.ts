import { describe, expect, it } from 'vitest';
import { QuestionPromptBuilder } from './question-prompt.builder.js';

describe('QuestionPromptBuilder', () => {
  it('should build prompt using provided topic and source text', () => {
    const prompt = QuestionPromptBuilder.buildGenerationPrompt({
      topic: 'Photosynthesis',
      sourceText: 'Light-dependent reactions take place on the thylakoid membrane.',
      mcqCount: 5,
      cqCount: 2,
      language: 'English',
      difficulty: 'hard',
    });

    expect(prompt).toContain('### SOURCE EDUCATIONAL CONTENT:');
    expect(prompt).toContain('thylakoid membrane');
    expect(prompt).toContain('Exact MCQ Count: 5');
    expect(prompt).toContain('Exact CQ (Creative/Structured Question) Count: 2');
    expect(prompt).toContain('Target Difficulty: hard');
  });

  it('should build single MCQ regeneration prompt', () => {
    const prompt = QuestionPromptBuilder.buildRegenerateMcqPrompt({
      existingQuestion: 'What is water?',
      topic: 'Chemistry',
      language: 'English',
      difficulty: 'easy',
    });

    expect(prompt).toContain('Previous question to replace: "What is water?"');
    expect(prompt).toContain('Generate exactly 1 MCQ');
  });

  it('should build single CQ regeneration prompt', () => {
    const prompt = QuestionPromptBuilder.buildRegenerateCqPrompt({
      existingStimulus: 'Old scenario about enzymes.',
      topic: 'Biochemistry',
      language: 'English',
      difficulty: 'medium',
    });

    expect(prompt).toContain('Previous stimulus to replace: "Old scenario about enzymes.');
    expect(prompt).toContain('Generate exactly 1 CQ');
  });
});
