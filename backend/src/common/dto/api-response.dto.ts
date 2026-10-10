import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty()
  data?: T;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  timestamp: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ required: false })
  errors?: any;

  @ApiProperty({ example: '2026-10-08T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/questions/generate' })
  path: string;
}
