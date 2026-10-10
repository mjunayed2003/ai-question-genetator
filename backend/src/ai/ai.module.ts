import { Module } from '@nestjs/common';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { GeminiProvider } from './provider/gemini.provider.js';
import { AI_PROVIDER } from './interface/ai-provider.interface.js';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    GeminiProvider,
    {
      provide: AI_PROVIDER,
      useExisting: GeminiProvider,
    },
  ],
  exports: [AiService, AI_PROVIDER],
})
export class AiModule {}