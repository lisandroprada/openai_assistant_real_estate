import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { Thread } from './schemas/thread.schema';
import { Message } from './schemas/message.schema';

@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  async createThread(@Body('userId') userId: string): Promise<Thread> {
    return this.threadsService.createThread(userId);
  }

  @Get()
  async findAll(): Promise<Thread[]> {
    return await this.threadsService.findAll();
  }

  @Get(':threadId')
  async getThreadMessages(
    @Param('threadId') threadId: string,
  ): Promise<Message[]> {
    return this.threadsService.getThreadMessages(threadId);
  }

  @Post(':threadId/messages')
  async addMessageToThread(
    @Param('threadId') threadId: string,
    @Body('content') content: string,
  ): Promise<Message> {
    // For now, we'll assume the role is 'user'. OpenAI integration will handle 'assistant' and 'function' roles.
    return this.threadsService.addMessageToThread(threadId, content);
  }

  @Delete(':threadId')
  async deleteThread(@Param('threadId') threadId: string): Promise<any> {
    return this.threadsService.deleteThread(threadId);
  }
}
