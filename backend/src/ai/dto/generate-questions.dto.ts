import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class GenerateQuestionsDto {
  @ApiPropertyOptional({
    description: 'Document UUID to generate questions from',
    example: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
  })
  @IsOptional()
  @IsUUID('4', { message: 'documentId must be a valid UUID' })
  documentId?: string;

  @ApiPropertyOptional({
    description: 'Topic for question generation (required if no documentId provided)',
    example: 'Photosynthesis',
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({
    description: 'Number of Multiple Choice Questions to generate (0 - 50)',
    example: 5,
    minimum: 0,
    maximum: 50,
  })
  @IsInt()
  @Min(0, { message: 'mcqCount must be at least 0' })
  @Max(50, { message: 'mcqCount cannot exceed 50 per request' })
  mcqCount: number;

  @ApiProperty({
    description: 'Number of Creative/Structured Questions to generate (0 - 20)',
    example: 2,
    minimum: 0,
    maximum: 20,
  })
  @IsInt()
  @Min(0, { message: 'cqCount must be at least 0' })
  @Max(20, { message: 'cqCount cannot exceed 20 per request' })
  cqCount: number;

  @ApiPropertyOptional({
    description: 'Language for the questions (e.g. English, Bengali, Spanish)',
    example: 'English',
    default: 'English',
  })
  @IsOptional()
  @IsString()
  language: string = 'English';

  @ApiPropertyOptional({
    description: 'Difficulty level (easy, medium, hard)',
    example: 'medium',
    default: 'medium',
  })
  @IsOptional()
  @IsString()
  difficulty: string = 'medium';
}