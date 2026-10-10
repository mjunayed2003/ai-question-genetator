import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SyncUserDto {
  @ApiProperty({ description: 'Firebase User UID', example: 'firebase-uid-12345' })
  @IsString()
  @IsNotEmpty()
  uid: string;

  @ApiProperty({ description: 'User Google / Gmail email address', example: 'user@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'User display name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'User profile avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;
}
