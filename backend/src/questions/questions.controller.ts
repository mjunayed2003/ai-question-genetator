import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QuestionsService } from './questions.service.js';
import { GenerateQuestionsDto } from '../ai/dto/generate-questions.dto.js';
import { UpdateQuestionSetDto } from './dto/update-question-set.dto.js';
import { UpdateMcqDto } from './dto/update-mcq.dto.js';
import { UpdateCqDto } from './dto/update-cq.dto.js';

@ApiTags('Questions Management')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate and save question set from document or topic',
    description:
      'Analyzes the provided document or topic, generates questions via Gemini, validates with Zod, and persists to PostgreSQL.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Question set generated, validated, and saved successfully.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input parameters or empty document.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found.' })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'AI output validation failed.' })
  async generateQuestionSet(
    @Body() dto: GenerateQuestionsDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.questionsService.generateAndSave(dto, userId);
  }

  @Get('sets')
  @ApiOperation({ summary: 'List all generated question sets' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async listQuestionSets(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Headers('x-user-id') userId?: string,
  ) {
    return this.questionsService.listQuestionSets(parseInt(page, 10), parseInt(limit, 10), userId);
  }

  @Get('sets/:id')
  @ApiOperation({ summary: 'Get a specific question set with all MCQs and CQs' })
  @ApiParam({ name: 'id', description: 'QuestionSet UUID' })
  async getQuestionSet(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.questionsService.getQuestionSetById(id, userId);
  }

  @Get('sets/:id/export')
  @ApiOperation({ summary: 'Export question set in structured and printable text format' })
  @ApiParam({ name: 'id', description: 'QuestionSet UUID' })
  async exportQuestionSet(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.questionsService.exportQuestionSet(id);
  }

  @Patch('sets/:id')
  @ApiOperation({ summary: 'Update question set metadata (topic, difficulty)' })
  @ApiParam({ name: 'id', description: 'QuestionSet UUID' })
  async updateQuestionSet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionSetDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.questionsService.updateQuestionSet(id, dto, userId);
  }

  @Delete('sets/:id')
  @ApiOperation({ summary: 'Delete a question set and all its MCQs and CQs' })
  @ApiParam({ name: 'id', description: 'QuestionSet UUID' })
  async deleteQuestionSet(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.questionsService.deleteQuestionSet(id, userId);
  }

  @Patch('mcq/:id')
  @ApiOperation({ summary: 'Edit an individual MCQ' })
  @ApiParam({ name: 'id', description: 'MCQ UUID' })
  async updateMcq(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMcqDto,
  ) {
    return this.questionsService.updateMcq(id, dto);
  }

  @Delete('mcq/:id')
  @ApiOperation({ summary: 'Delete an individual MCQ' })
  @ApiParam({ name: 'id', description: 'MCQ UUID' })
  async deleteMcq(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.deleteMcq(id);
  }

  @Post('mcq/:id/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Regenerate an individual MCQ using source content and Gemini',
    description: 'Generates a replacement MCQ, validates with Zod, and replaces the existing record.',
  })
  @ApiParam({ name: 'id', description: 'MCQ UUID' })
  async regenerateMcq(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.regenerateMcq(id);
  }

  @Patch('cq/:id')
  @ApiOperation({ summary: 'Edit an individual Creative Question (CQ)' })
  @ApiParam({ name: 'id', description: 'CQ UUID' })
  async updateCq(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCqDto,
  ) {
    return this.questionsService.updateCq(id, dto);
  }

  @Delete('cq/:id')
  @ApiOperation({ summary: 'Delete an individual Creative Question (CQ)' })
  @ApiParam({ name: 'id', description: 'CQ UUID' })
  async deleteCq(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.deleteCq(id);
  }

  @Post('cq/:id/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Regenerate an individual CQ using source content and Gemini',
    description: 'Generates a replacement CQ, validates with Zod, and replaces the existing record.',
  })
  @ApiParam({ name: 'id', description: 'CQ UUID' })
  async regenerateCq(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionsService.regenerateCq(id);
  }
}
