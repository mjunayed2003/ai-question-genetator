import {
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { DocumentsService } from './documents.service.js';
import { FileUploadDto } from './dto/upload-document.dto.js';

// Ensure uploads folder exists synchronously on module load
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload educational document (PDF, PNG, JPG, JPEG, WEBP)',
    description: 'Uploads a document, extracts text if PDF, and stores metadata in PostgreSQL.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload (Max 15MB)',
    type: FileUploadDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded and processed successfully.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file type or size.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const sanitizedBase = path
            .basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9-_]/g, '_');
          cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required. Please sign in to upload documents.');
    }
    return this.documentsService.processUpload(file, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all uploaded documents' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async listDocuments(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Headers('x-user-id') userId?: string,
  ) {
    return this.documentsService.findAll(parseInt(page, 10), parseInt(limit, 10), userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details and extracted content' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async getDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required. Please sign in to view documents.');
    }
    return this.documentsService.findById(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document and its file' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required. Please sign in to delete documents.');
    }
    return this.documentsService.delete(id, userId);
  }
}
