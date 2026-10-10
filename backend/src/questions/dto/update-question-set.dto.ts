import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateQuestionSetDto {
  @ApiPropertyOptional({ example: 'Advanced Photosynthesis & Cellular Respiration' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ example: 'hard' })
  @IsOptional()
  @IsString()
  difficulty?: string;
}
