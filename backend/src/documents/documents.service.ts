import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocumentStatus } from '@prisma/client';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processUpload(file: Express.Multer.File, userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required. Please sign in to upload documents.');
    }

    if (!file) {
      throw new BadRequestException('No file provided. Please attach a file.');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed formats: PDF, PNG, JPG, JPEG, WEBP.`,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size exceeds maximum limit of 15MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );
    }

    // 1. Create document record associated strictly with userId
    const document = await this.prisma.document.create({
      data: {
        userId,
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: DocumentStatus.PROCESSING,
      },
    });

    // 2. Extract text if PDF, or flag as image for multimodal
    try {
      if (file.mimetype === 'application/pdf') {
        const extractedText = await this.extractTextFromPdf(file.path);
        
        const isScannedOrEmpty = !extractedText || extractedText.trim().length === 0;

        const updated = await this.prisma.document.update({
          where: { id: document.id },
          data: {
            extractedText: isScannedOrEmpty ? '' : extractedText.trim(),
            status: DocumentStatus.PROCESSED,
            errorMessage: isScannedOrEmpty
              ? 'PDF contains no selectable text (scanned or image-only PDF). Multimodal processing recommended.'
              : null,
          },
        });

        this.logger.log(`Document "${document.id}" successfully processed with ${updated.extractedText?.length ?? 0} characters.`);
        return updated;
      } else {
        // Image files
        const updated = await this.prisma.document.update({
          where: { id: document.id },
          data: {
            status: DocumentStatus.PROCESSED,
          },
        });
        this.logger.log(`Image document "${document.id}" uploaded and ready for multimodal inference.`);
        return updated;
      }
    } catch (error) {
      this.logger.error(`Failed to parse document "${document.id}": ${(error as Error).message}`, (error as Error).stack);

      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.FAILED,
          errorMessage: `Processing failed: ${(error as Error).message}`,
        },
      });

      throw new InternalServerErrorException(
        `Document upload stored, but text parsing failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Robust PDF Text Extraction supporting pdf-parse v2 and v1
   */
  async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath);
      const pdfParseModule = await import('pdf-parse');
      const PDFParseTarget =
        (pdfParseModule as any).PDFParse ??
        (pdfParseModule as any).default ??
        pdfParseModule;

      // 1. pdf-parse v2.x (Class based)
      if (typeof PDFParseTarget === 'function' && PDFParseTarget.prototype?.getText) {
        const parser = new PDFParseTarget({ data: buffer });
        try {
          const result = await parser.getText();
          const extracted = result?.text?.trim() ?? '';
          return extracted;
        } finally {
          if (typeof parser.destroy === 'function') {
            await parser.destroy();
          }
        }
      }

      // 2. pdf-parse v1.x (Function based)
      if (typeof PDFParseTarget === 'function') {
        const data = await PDFParseTarget(buffer);
        return data?.text?.trim() ?? '';
      }

      return '';
    } catch (err) {
      this.logger.warn(`PDF parser warning for ${filePath}: ${(err as Error).message}`);
      return '';
    }
  }

  async findAll(page = 1, limit = 20, userId?: string) {
    // If not signed in, return zero documents
    if (!userId) {
      return {
        documents: [],
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

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          originalName: true,
          mimeType: true,
          fileSize: true,
          status: true,
          errorMessage: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required. Please sign in to view this document.');
    }

    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        questionSets: {
          select: {
            id: true,
            topic: true,
            mcqCount: true,
            cqCount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found.`);
    }

    if (document.userId && document.userId !== userId) {
      throw new ForbiddenException('You do not have access to view this document.');
    }

    return document;
  }

  async delete(id: string, userId?: string) {
    const document = await this.findById(id, userId);

    // Delete file from disk if it exists
    try {
      if (document.filePath) {
        await fs.unlink(document.filePath);
      }
    } catch (err) {
      this.logger.warn(`Could not delete file ${document.filePath}: ${(err as Error).message}`);
    }

    await this.prisma.document.delete({ where: { id } });

    return { message: `Document "${id}" deleted successfully.` };
  }
}
