export interface BuildPromptOptions {
  topic?: string;
  sourceText?: string;
  mcqCount: number;
  cqCount: number;
  language: string;
  difficulty: string;
}

export interface BuildRegenerateMcqOptions {
  existingQuestion: string;
  sourceText?: string;
  topic?: string;
  language: string;
  difficulty: string;
}

export interface BuildRegenerateCqOptions {
  existingStimulus: string;
  sourceText?: string;
  topic?: string;
  language: string;
  difficulty: string;
}

export class QuestionPromptBuilder {
  /**
   * Builds prompt for generating a new set of MCQs and CQs.
   */
  static buildGenerationPrompt(options: BuildPromptOptions): string {
    const { topic, sourceText, mcqCount, cqCount, language, difficulty } = options;

    const sourceSection = sourceText && sourceText.trim().length > 0
      ? `### SOURCE EDUCATIONAL CONTENT:
"""
${sourceText.trim().slice(0, 50000)}
"""`
      : `### TOPIC FOCUS:
${topic || 'General Science and Academics'}`;

    const topicDirective = topic ? `Specific focus topic: "${topic}".` : '';

    return `
You are an expert academic assessment creator and educational question designer.

${sourceSection}

### GENERATION INSTRUCTIONS:
${topicDirective}
- Language: ${language}
- Target Difficulty: ${difficulty}
- Exact MCQ Count: ${mcqCount}
- Exact CQ (Creative/Structured Question) Count: ${cqCount}

### CRITICAL RULES:
1. STRICT SOURCE ADHERENCE: You must construct questions exclusively using facts, theories, definitions, and relationships directly present in or strictly relevant to the provided source content. Do NOT invent unrelated facts.
2. MCQ SPECIFICATIONS (Exactly ${mcqCount} MCQs):
   - Each MCQ must have exactly 4 plausible options.
   - Exactly one option must be the correct answer.
   - The "answer" field must be the EXACT full text of the correct option (e.g. "Mitochondria").
   - Include a concise, academically sound explanation.
   - Assign the difficulty level ("${difficulty}").
3. CQ SPECIFICATIONS (Exactly ${cqCount} CQs):
   - Each CQ must have an engaging, realistic stimulus/scenario based on the source content.
   - Exactly 4 sub-questions:
     * "a": Knowledge-based (Recall)
     * "b": Comprehension-based (Explanation)
     * "c": Application-based (Analysis/Application)
     * "d": Higher-order evaluation/synthesis (Critical thinking)
   - Assign the difficulty level ("${difficulty}").
4. AVOID DUPLICATES: Every question must test a distinct concept.

Return ONLY the structured JSON matching the requested schema.
`;
  }

  /**
   * Builds prompt for regenerating a single MCQ.
   */
  static buildRegenerateMcqPrompt(options: BuildRegenerateMcqOptions): string {
    const { existingQuestion, sourceText, topic, language, difficulty } = options;
    const context = sourceText ? `Source Content:\n"""\n${sourceText.slice(0, 30000)}\n"""` : `Topic: "${topic}"`;

    return `
You are an expert educational question generator.

${context}

You need to replace this previous MCQ with a brand new, higher-quality question:
Previous question to replace: "${existingQuestion}"

CRITICAL RULES:
1. Generate exactly 1 MCQ in "${language}" with "${difficulty}" difficulty.
2. Provide exactly 4 distinct options.
3. Only 1 option must be correct, with a clear explanation.
4. The new question must NOT be a duplicate of the previous question.

Return JSON in the format:
{
  "mcqs": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "answer": "...",
      "explanation": "...",
      "difficulty": "${difficulty}"
    }
  ],
  "cqs": []
}
`;
  }

  /**
   * Builds prompt for regenerating a single CQ.
   */
  static buildRegenerateCqPrompt(options: BuildRegenerateCqOptions): string {
    const { existingStimulus, sourceText, topic, language, difficulty } = options;
    const context = sourceText ? `Source Content:\n"""\n${sourceText.slice(0, 30000)}\n"""` : `Topic: "${topic}"`;

    return `
You are an expert educational question generator.

${context}

You need to replace this previous Creative Question (CQ) with a brand new, higher-quality question:
Previous stimulus to replace: "${existingStimulus.slice(0, 200)}..."

CRITICAL RULES:
1. Generate exactly 1 CQ in "${language}" with "${difficulty}" difficulty.
2. Provide a rich stimulus and 4 graded sub-questions (a, b, c, d).
3. The new question must NOT be a duplicate of the previous question.

Return JSON in the format:
{
  "mcqs": [],
  "cqs": [
    {
      "stimulus": "...",
      "questions": {
        "a": "...",
        "b": "...",
        "c": "...",
        "d": "..."
      },
      "difficulty": "${difficulty}"
    }
  ]
}
`;
  }
}
