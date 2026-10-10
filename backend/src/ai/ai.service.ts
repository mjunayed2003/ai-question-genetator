import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AI_PROVIDER, type AIProvider, GenerateQuestionsInput } from './interface/ai-provider.interface.js';
import {
  CqItemSchema,
  McqItemSchema,
  validateAndSanitizeAiOutput,
  ValidatedCqItem,
  ValidatedMcqItem,
  ValidatedQuestionsOutput,
} from './schemas/generated-questions.schema.js';
import { QuestionPromptBuilder } from './prompts/question-prompt.builder.js';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER)
    private readonly provider: AIProvider,
  ) {}

  /**
   * Generates a full set of questions and strictly validates them with Zod.
   */
  async generateQuestions(input: GenerateQuestionsInput): Promise<ValidatedQuestionsOutput> {
    if (!input.topic && !input.sourceText) {
      throw new BadRequestException('Either a topic or a document source must be provided.');
    }

    if (input.mcqCount === 0 && input.cqCount === 0) {
      throw new BadRequestException('At least one MCQ or CQ must be requested (count > 0).');
    }

    this.logger.log(
      `Generating questions: topic="${input.topic || 'Document-based'}", MCQs=${input.mcqCount}, CQs=${input.cqCount}, lang=${input.language}, diff=${input.difficulty}`,
    );

    let rawResponse: any;
    try {
      rawResponse = await this.provider.generateQuestions(input);
    } catch (err: any) {
      this.logger.error(`AI provider failed during generation: ${err.message}`);
      throw err;
    }

    // Strict Zod Validation & Count Enforcement
    try {
      const validated = validateAndSanitizeAiOutput(
        rawResponse,
        input.mcqCount,
        input.cqCount,
      );
      this.logger.log(
        `Successfully generated and validated ${validated.mcqs.length} MCQs and ${validated.cqs.length} CQs.`,
      );
      return validated;
    } catch (validationErr: any) {
      this.logger.error(`AI output validation error: ${validationErr.message}`);
      throw new UnprocessableEntityException(validationErr.message);
    }
  }

  /**
   * Regenerates a single MCQ using source context.
   */
  async regenerateMcq(options: {
    existingQuestion: string;
    sourceText?: string;
    topic?: string;
    language: string;
    difficulty: string;
  }): Promise<ValidatedMcqItem> {
    const prompt = QuestionPromptBuilder.buildRegenerateMcqPrompt(options);

    let raw: any;
    if (this.provider.generateContent) {
      raw = await this.provider.generateContent(prompt);
    } else {
      raw = await this.provider.generateQuestions({
        topic: options.topic,
        sourceText: options.sourceText,
        mcqCount: 1,
        cqCount: 0,
        language: options.language,
        difficulty: options.difficulty,
      });
    }

    const firstMcq = raw?.mcqs?.[0];
    if (!firstMcq) {
      throw new UnprocessableEntityException('AI did not return a regenerated MCQ.');
    }

    const parseResult = McqItemSchema.safeParse(firstMcq);
    if (!parseResult.success) {
      throw new UnprocessableEntityException(
        `Regenerated MCQ failed validation: ${parseResult.error.message}`,
      );
    }

    return parseResult.data;
  }

  /**
   * Regenerates a single CQ using source context.
   */
  async regenerateCq(options: {
    existingStimulus: string;
    sourceText?: string;
    topic?: string;
    language: string;
    difficulty: string;
  }): Promise<ValidatedCqItem> {
    const prompt = QuestionPromptBuilder.buildRegenerateCqPrompt(options);

    let raw: any;
    if (this.provider.generateContent) {
      raw = await this.provider.generateContent(prompt);
    } else {
      raw = await this.provider.generateQuestions({
        topic: options.topic,
        sourceText: options.sourceText,
        mcqCount: 0,
        cqCount: 1,
        language: options.language,
        difficulty: options.difficulty,
      });
    }

    const firstCq = raw?.cqs?.[0];
    if (!firstCq) {
      throw new UnprocessableEntityException('AI did not return a regenerated CQ.');
    }

    const parseResult = CqItemSchema.safeParse(firstCq);
    if (!parseResult.success) {
      throw new UnprocessableEntityException(
        `Regenerated CQ failed validation: ${parseResult.error.message}`,
      );
    }

    return parseResult.data;
  }
}