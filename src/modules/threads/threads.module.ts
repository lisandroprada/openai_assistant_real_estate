import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Thread, ThreadSchema } from './schemas/thread.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';
import { OpenaiModule } from '../openai/openai.module';
import { FunctionsModule } from '../functions/functions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Thread.name, schema: ThreadSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    OpenaiModule,
    FunctionsModule,
  ],
  exports: [MongooseModule],
  controllers: [ThreadsController],
  providers: [ThreadsService],
})
export class ThreadsModule {}
