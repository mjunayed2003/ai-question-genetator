import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { GenerateQuestionsDto } from '../ai/dto/generate-questions.dto.js';
import { UpdateQuestionSetDto } from './dto/update-question-set.dto.js';
import { UpdateMcqDto } from './dto/update-mcq.dto.js';
import { UpdateCqDto } from './dto/update-cq.dto.js';

import { DocumentsService } from '../documents/documents.service.js';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly documentsService: DocumentsService,
  ) {}

  /**
   * Generates questions using AI and persists the QuestionSet, MCQs, and CQs in PostgreSQL.
   */
  async generateAndSave(dto: GenerateQuestionsDto, userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required. Please sign in to generate questions.');
    }

    let sourceText = '';
    let documentTitle = '';

    // If documentId is provided, verify ownership and retrieve document content
    if (dto.documentId) {
      const document = await this.prisma.document.findUnique({
        where: { id: dto.documentId },
      });

      if (!document) {
        throw new NotFoundException(`Document with ID "${dto.documentId}" not found.`);
      }

      if (document.userId && document.userId !== userId) {
        throw new ForbiddenException('You do not have permission to use this document.');
      }

      if (document.extractedText && document.extractedText.trim().length > 0) {
        sourceText = document.extractedText;
        documentTitle = document.originalName;
      } else {
        // Attempt on-the-fly text extraction if the physical file still exists
        if (document.filePath && document.mimeType === 'application/pdf') {
          try {
            const reExtracted = await this.documentsService.extractTextFromPdf(document.filePath);
            if (reExtracted && reExtracted.trim().length > 0) {
              sourceText = reExtracted.trim();
              documentTitle = document.originalName;
              await this.prisma.document.update({
                where: { id: document.id },
                data: { extractedText: sourceText },
              });
            }
          } catch (reErr) {
            this.logger.warn(`On-the-fly re-extraction failed: ${(reErr as Error).message}`);
          }
        }

        if (!sourceText && !dto.topic) {
          throw new BadRequestException(
            'The selected document has no extracted text. Please provide a topic or upload a readable text PDF.',
          );
        }
      }
    }

    if (!dto.topic && !sourceText) {
      throw new BadRequestException('Either a topic or a document with extractable text is required.');
    }

    // Call AI Service to generate validated questions
    const generated = await this.aiService.generateQuestions({
      ...dto,
      sourceText,
    });

    // Save to Database in a transaction
    const questionSet = await this.prisma.$transaction(async (tx) => {
      const qSet = await tx.questionSet.create({
        data: {
          userId,
          documentId: dto.documentId || null,
          topic: dto.topic || documentTitle || 'Generated Question Set',
          language: dto.language || 'English',
          difficulty: dto.difficulty || 'medium',
          mcqCount: generated.mcqs.length,
          cqCount: generated.cqs.length,
          status: 'GENERATED',
        },
      });

      // Create MCQs
      if (generated.mcqs.length > 0) {
        await tx.mCQ.createMany({
          data: generated.mcqs.map((mcq, idx) => ({
            questionSetId: qSet.id,
            question: mcq.question,
            options: mcq.options,
            answer: mcq.answer,
            explanation: mcq.explanation,
            difficulty: mcq.difficulty || dto.difficulty || 'medium',
            order: idx + 1,
          })),
        });
      }

      // Create CQs
      if (generated.cqs.length > 0) {
        await tx.cQ.createMany({
          data: generated.cqs.map((cq, idx) => ({
            questionSetId: qSet.id,
            stimulus: cq.stimulus,
            questionA: cq.questions.a,
            questionB: cq.questions.b,
            questionC: cq.questions.c,
            questionD: cq.questions.d,
            difficulty: cq.difficulty || dto.difficulty || 'medium',
            order: idx + 1,
          })),
        });
      }

      return qSet;
    });

    this.logger.log(`Saved QuestionSet "${questionSet.id}" to database for user "${userId}" with ${generated.mcqs.length} MCQs and ${generated.cqs.length} CQs.`);

    return this.getQuestionSetById(questionSet.id, userId);
  }

  async listQuestionSets(page = 1, limit = 20, userId?: string) {
    if (!userId) {
      return {
        questionSets: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const skip = (page - 1) * limit;
    const where = { userId };

    const [questionSets, total] = await Promise.all([
      this.prisma.questionSet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          document: {
            select: {
              id: true,
              originalName: true,
              mimeType: true,
            },
          },
          _count: {
            select: {
              mcqs: true,
              cqs: true,
            },
          },
        },
      }),
      this.prisma.questionSet.count({ where }),
    ]);

    return {
      questionSets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getQuestionSetById(id: string, userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required. Please sign in to view question sets.');
    }

    const questionSet = await this.prisma.questionSet.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
          },
        },
        mcqs: {
          orderBy: { order: 'asc' },
        },
        cqs: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!questionSet) {
      throw new NotFoundException(`Question set with ID "${id}" not found.`);
    }

    if (questionSet.userId && questionSet.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this question set.');
    }

    return questionSet;
  }

  async updateQuestionSet(id: string, dto: UpdateQuestionSetDto, userId?: string) {
    await this.getQuestionSetById(id, userId);

    return this.prisma.questionSet.update({
      where: { id },
      data: {
        ...(dto.topic !== undefined ? { topic: dto.topic } : {}),
        ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
      },
    });
  }

  async deleteQuestionSet(id: string, userId?: string) {
    await this.getQuestionSetById(id, userId);

    await this.prisma.questionSet.delete({ where: { id } });
    return { message: `Question set "${id}" and its questions were deleted successfully.` };
  }

  async updateMcq(id: string, dto: UpdateMcqDto, userId?: string) {
    const mcq = await this.prisma.mCQ.findUnique({
      where: { id },
      include: { questionSet: true },
    });
    if (!mcq) {
      throw new NotFoundException(`MCQ with ID "${id}" not found.`);
    }

    if (userId && mcq.questionSet.userId && mcq.questionSet.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this MCQ.');
    }

    return this.prisma.mCQ.update({
      where: { id },
      data: {
        ...(dto.question !== undefined ? { question: dto.question } : {}),
        ...(dto.options !== undefined ? { options: dto.options } : {}),
        ...(dto.answer !== undefined ? { answer: dto.answer } : {}),
        ...(dto.explanation !== undefined ? { explanation: dto.explanation } : {}),
        ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
      },
    });
  }

  async deleteMcq(id: string, userId?: string) {
    const mcq = await this.prisma.mCQ.findUnique({
      where: { id },
      include: { questionSet: true },
    });
    if (!mcq) {
      throw new NotFoundException(`MCQ with ID "${id}" not found.`);
    }

    if (userId && mcq.questionSet.userId && mcq.questionSet.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this MCQ.');
    }

    await this.prisma.$transaction([
      this.prisma.mCQ.delete({ where: { id } }),
      this.prisma.questionSet.update({
        where: { id: mcq.questionSetId },
        data: { mcqCount: { decrement: 1 } },
      }),
    ]);

    return { message: `MCQ "${id}" deleted successfully.` };
  }

  async updateCq(id: string, dto: UpdateCqDto, userId?: string) {
    const cq = await this.prisma.cQ.findUnique({
      where: { id },
      include: { questionSet: true },
    });
    if (!cq) {
      throw new NotFoundException(`CQ with ID "${id}" not found.`);
    }

    if (userId && cq.questionSet.userId && cq.questionSet.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this CQ.');
    }

    return this.prisma.cQ.update({
      where: { id },
      data: {
        ...(dto.stimulus !== undefined ? { stimulus: dto.stimulus } : {}),
        ...(dto.questionA !== undefined ? { questionA: dto.questionA } : {}),
        ...(dto.questionB !== undefined ? { questionB: dto.questionB } : {}),
        ...(dto.questionC !== undefined ? { questionC: dto.questionC } : {}),
        ...(dto.questionD !== undefined ? { questionD: dto.questionD } : {}),
        ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
      },
    });
  }

  async deleteCq(id: string, userId?: string) {
    const cq = await this.prisma.cQ.findUnique({
      where: { id },
      include: { questionSet: true },
    });
    if (!cq) {
      throw new NotFoundException(`CQ with ID "${id}" not found.`);
    }

    if (userId && cq.questionSet.userId && cq.questionSet.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this CQ.');
    }

    await this.prisma.$transaction([
      this.prisma.cQ.delete({ where: { id } }),
      this.prisma.questionSet.update({
        where: { id: cq.questionSetId },
        data: { cqCount: { decrement: 1 } },
      }),
    ]);

    return { message: `CQ "${id}" deleted successfully.` };
  }

  /**
   * Regenerates a single MCQ using original source context and replaces it in the database.
   */
  async regenerateMcq(id: string, userId?: string) {
    const existingMcq = await this.prisma.mCQ.findUnique({
      where: { id },
      include: {
        questionSet: {
          include: {
            document: true,
          },
        },
      },
    });

    if (!existingMcq) {
      throw new NotFoundException(`MCQ with ID "${id}" not found.`);
    }

    if (userId && existingMcq.questionSet.userId && existingMcq.questionSet.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this MCQ.');
    }

    const { questionSet } = existingMcq;
    const sourceText = questionSet.document?.extractedText || undefined;
    const topic = questionSet.topic || undefined;

    this.logger.log(`Regenerating MCQ "${id}" for question set "${questionSet.id}"...`);

    const newMcq = await this.aiService.regenerateMcq({
      existingQuestion: existingMcq.question,
      sourceText,
      topic,
      language: questionSet.language,
      difficulty: existingMcq.difficulty || questionSet.difficulty,
    });

    // Replace in database only after validation has succeeded
    const updated = await this.prisma.mCQ.update({
      where: { id },
      data: {
        question: newMcq.question,
        options: newMcq.options,
        answer: newMcq.answer,
        explanation: newMcq.explanation,
        difficulty: newMcq.difficulty,
      },
    });

    this.logger.log(`Successfully regenerated and updated MCQ "${id}".`);
    return updated;
  }

  /**
   * Regenerates a single CQ using original source context and replaces it in the database.
   */
  async regenerateCq(id: string, userId?: string) {
    const existingCq = await this.prisma.cQ.findUnique({
      where: { id },
      include: {
        questionSet: {
          include: {
            document: true,
          },
        },
      },
    });

    if (!existingCq) {
      throw new NotFoundException(`CQ with ID "${id}" not found.`);
    }

    if (userId && existingCq.questionSet.userId && existingCq.questionSet.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this CQ.');
    }

    const { questionSet } = existingCq;
    const sourceText = questionSet.document?.extractedText || undefined;
    const topic = questionSet.topic || undefined;

    this.logger.log(`Regenerating CQ "${id}" for question set "${questionSet.id}"...`);

    const newCq = await this.aiService.regenerateCq({
      existingStimulus: existingCq.stimulus,
      sourceText,
      topic,
      language: questionSet.language,
      difficulty: existingCq.difficulty || questionSet.difficulty,
    });

    // Replace in database only after validation has succeeded
    const updated = await this.prisma.cQ.update({
      where: { id },
      data: {
        stimulus: newCq.stimulus,
        questionA: newCq.questions.a,
        questionB: newCq.questions.b,
        questionC: newCq.questions.c,
        questionD: newCq.questions.d,
        difficulty: newCq.difficulty,
      },
    });

    this.logger.log(`Successfully regenerated and updated CQ "${id}".`);
    return updated;
  }

  /**
   * Exports a question set formatted for printing, PDF, or text distribution.
   */
  async exportQuestionSet(id: string, userId?: string) {
    const questionSet = await this.getQuestionSetById(id, userId);

    let plainText = `=================================================\n`;
    plainText += `QUESTION SET: ${questionSet.topic || 'Untitled'}\n`;
    plainText += `Language: ${questionSet.language} | Difficulty: ${questionSet.difficulty}\n`;
    plainText += `Generated: ${new Date(questionSet.createdAt).toLocaleDateString()}\n`;
    plainText += `=================================================\n\n`;

    if (questionSet.mcqs.length > 0) {
      plainText += `--- SECTION A: MULTIPLE CHOICE QUESTIONS (${questionSet.mcqs.length}) ---\n\n`;
      questionSet.mcqs.forEach((mcq, idx) => {
        const optionsArr = (Array.isArray(mcq.options) ? mcq.options : []) as string[];
        plainText += `${idx + 1}. ${mcq.question}\n`;
        optionsArr.forEach((opt: string, optIdx: number) => {
          const letter = String.fromCharCode(65 + optIdx);
          plainText += `   ${letter}) ${opt}\n`;
        });
        plainText += `   [Correct Answer: ${mcq.answer}]\n`;
        plainText += `   [Explanation: ${mcq.explanation}]\n\n`;
      });
    }

    if (questionSet.cqs.length > 0) {
      plainText += `--- SECTION B: CREATIVE / STRUCTURED QUESTIONS (${questionSet.cqs.length}) ---\n\n`;
      questionSet.cqs.forEach((cq, idx) => {
        plainText += `CQ ${idx + 1}:\n`;
        plainText += `Stimulus:\n${cq.stimulus}\n\n`;
        plainText += `   a) ${cq.questionA} [1 Mark]\n`;
        plainText += `   b) ${cq.questionB} [2 Marks]\n`;
        plainText += `   c) ${cq.questionC} [3 Marks]\n`;
        plainText += `   d) ${cq.questionD} [4 Marks]\n\n`;
      });
    }

    return {
      questionSet,
      exportText: plainText,
    };
  }
}
