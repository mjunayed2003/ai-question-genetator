import { describe, expect, it, beforeEach, vi } from 'vitest';
import { QuestionsService } from './questions.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let mockPrisma: any;
  let mockAiService: any;

  beforeEach(() => {
    mockPrisma = {
      document: {
        findUnique: vi.fn(),
      },
      questionSet: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      mCQ: {
        createMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      cQ: {
        createMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    };

    mockAiService = {
      generateQuestions: vi.fn().mockResolvedValue({
        mcqs: [
          {
            question: 'Mock question 1?',
            options: ['A', 'B', 'C', 'D'],
            answer: 'A',
            explanation: 'Explanation',
            difficulty: 'medium',
          },
        ],
        cqs: [
          {
            stimulus: 'Stimulus scenario',
            questions: { a: 'Sub A', b: 'Sub B', c: 'Sub C', d: 'Sub D' },
            difficulty: 'medium',
          },
        ],
      }),
      regenerateMcq: vi.fn(),
      regenerateCq: vi.fn(),
    };

    service = new QuestionsService(mockPrisma, mockAiService);
  });

  it('should generate and save a question set when given a topic', async () => {
    const fakeQSet = {
      id: 'qset-123',
      topic: 'Photosynthesis',
      language: 'English',
      difficulty: 'medium',
      mcqCount: 1,
      cqCount: 1,
      createdAt: new Date(),
    };

    mockPrisma.questionSet.create.mockResolvedValue(fakeQSet);
    mockPrisma.questionSet.findUnique.mockResolvedValue({
      ...fakeQSet,
      mcqs: [],
      cqs: [],
    });

    const result = await service.generateAndSave({
      topic: 'Photosynthesis',
      mcqCount: 1,
      cqCount: 1,
      language: 'English',
      difficulty: 'medium',
    });

    expect(mockAiService.generateQuestions).toHaveBeenCalled();
    expect(mockPrisma.questionSet.create).toHaveBeenCalled();
    expect(mockPrisma.mCQ.createMany).toHaveBeenCalled();
    expect(mockPrisma.cQ.createMany).toHaveBeenCalled();
    expect(result.id).toBe('qset-123');
  });

  it('should throw NotFoundException if documentId does not exist', async () => {
    mockPrisma.document.findUnique.mockResolvedValue(null);

    await expect(
      service.generateAndSave({
        documentId: 'non-existent-doc-uuid',
        mcqCount: 1,
        cqCount: 1,
        language: 'English',
        difficulty: 'medium',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if document has no text and no topic provided', async () => {
    mockPrisma.document.findUnique.mockResolvedValue({
      id: 'doc-empty',
      extractedText: '',
      originalName: 'scanned.pdf',
    });

    await expect(
      service.generateAndSave({
        documentId: 'doc-empty',
        mcqCount: 1,
        cqCount: 1,
        language: 'English',
        difficulty: 'medium',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should export question set with formatted readable text', async () => {
    mockPrisma.questionSet.findUnique.mockResolvedValue({
      id: 'qset-export-1',
      topic: 'Cell Biology',
      language: 'English',
      difficulty: 'medium',
      createdAt: new Date(),
      mcqs: [
        {
          question: 'What is the powerhouse of the cell?',
          options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Vacuole'],
          answer: 'Mitochondria',
          explanation: 'Mitochondria generate ATP.',
        },
      ],
      cqs: [],
    });

    const exported = await service.exportQuestionSet('qset-export-1');
    expect(exported.exportText).toContain('QUESTION SET: Cell Biology');
    expect(exported.exportText).toContain('What is the powerhouse of the cell?');
    expect(exported.exportText).toContain('[Correct Answer: Mitochondria]');
  });
});
