import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCqDto {
  @ApiPropertyOptional({ example: 'Updated stimulus scenario text...' })
  @IsOptional()
  @IsString()
  stimulus?: string;

  @ApiPropertyOptional({ example: 'Updated sub-question a' })
  @IsOptional()
  @IsString()
  questionA?: string;

  @ApiPropertyOptional({ example: 'Updated sub-question b' })
  @IsOptional()
  @IsString()
  questionB?: string;

  @ApiPropertyOptional({ example: 'Updated sub-question c' })
  @IsOptional()
  @IsString()
  questionC?: string;

  @ApiPropertyOptional({ example: 'Updated sub-question d' })
  @IsOptional()
  @IsString()
  questionD?: string;

  @ApiPropertyOptional({ example: 'medium' })
  @IsOptional()
  @IsString()
  difficulty?: string;
}
