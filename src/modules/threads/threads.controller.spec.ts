import { Test, TestingModule } from '@nestjs/testing';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';

describe('ThreadsController', () => {
  let controller: ThreadsController;
  let service: ThreadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThreadsController],
      providers: [
        {
          provide: ThreadsService,
          useValue: {
            createThread: jest.fn(),
            getThreadMessages: jest.fn(),
            addMessageToThread: jest.fn(),
            deleteThread: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ThreadsController>(ThreadsController);
    service = module.get<ThreadsService>(ThreadsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
