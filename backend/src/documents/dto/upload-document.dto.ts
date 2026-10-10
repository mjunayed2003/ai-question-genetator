import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Upload a PDF, PNG, JPG, JPEG, or WEBP file (max 15MB)' })
  file: any;
}
