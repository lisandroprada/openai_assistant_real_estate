import { Test, TestingModule } from '@nestjs/testing';
import { ThreadsService } from './threads.service';
import { getModelToken } from '@nestjs/mongoose';
import { Thread } from './schemas/thread.schema';
import { Message } from './schemas/message.schema';
import { OpenaiService } from '../openai/openai.service';
import { FunctionsService } from '../functions/functions.service';

describe('ThreadsService', () => {
  let service: ThreadsService;
  let threadModel: any;
  let messageModel: any;
  let openaiService: any;
  let functionsService: any;

  beforeEach(async () => {
    threadModel = {
      findById: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn(),
    };
    messageModel = {
      save: jest.fn(),
      deleteMany: jest.fn(),
    };
    openaiService = {
      getChatCompletion: jest.fn(),
    };
    functionsService = {
      callFunction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThreadsService,
        {
          provide: getModelToken(Thread.name),
          useValue: threadModel,
        },
        {
          provide: getModelToken(Message.name),
          useValue: messageModel,
        },
        {
          provide: OpenaiService,
          useValue: openaiService,
        },
        {
          provide: FunctionsService,
          useValue: functionsService,
        },
      ],
    }).compile();

    service = module.get<ThreadsService>(ThreadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
