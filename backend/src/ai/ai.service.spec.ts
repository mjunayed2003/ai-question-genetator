import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service.js';
import { AI_PROVIDER } from './interface/ai-provider.interface.js';
import { MockProvider } from './provider/mock.provider.js';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: AI_PROVIDER,
          useClass: MockProvider,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
