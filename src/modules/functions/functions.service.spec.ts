import { Test, TestingModule } from '@nestjs/testing';
import { FunctionsService } from './functions.service';
import { ConfigModule } from '@nestjs/config';

describe('FunctionsService', () => {
  let service: FunctionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [FunctionsService],
    }).compile();

    service = module.get<FunctionsService>(FunctionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
