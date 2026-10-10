import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateMcqDto {
  @ApiPropertyOptional({ example: 'Updated question prompt?' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ example: ['Option 1', 'Option 2', 'Option 3', 'Option 4'] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'Option 1' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ example: 'Updated explanation.' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 'medium' })
  @IsOptional()
  @IsString()
  difficulty?: string;
}
