import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service.js';
import { GenerateQuestionsDto } from './dto/generate-questions.dto.js';

@ApiTags('AI Question Generation')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate questions directly (standalone AI generation)',
    description: 'Generates MCQs and CQs using Gemini without saving to the database.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Questions generated and validated successfully.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input parameters.' })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'AI output validation failed.' })
  async generate(@Body() dto: GenerateQuestionsDto) {
    return this.aiService.generateQuestions(dto);
  }

  // Preserve backwards compatibility with existing /ai/generator route
  @Post('generator')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate questions (alias for /ai/generate)',
    description: 'Preserved route for backwards compatibility with earlier setup.',
  })
  async generateLegacy(@Body() dto: GenerateQuestionsDto) {
    return this.aiService.generateQuestions(dto);
  }
}
