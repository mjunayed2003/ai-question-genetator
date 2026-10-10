import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller.js';
import { QuestionsService } from './questions.service.js';
import { AiModule } from '../ai/ai.module.js';
import { DocumentsModule } from '../documents/documents.module.js';

@Module({
  imports: [AiModule, DocumentsModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
