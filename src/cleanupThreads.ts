import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Thread } from './modules/threads/schemas/thread.schema';
import { Message } from './modules/threads/schemas/message.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

async function cleanupThreads() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const threadModel = app.get<Model<Thread>>(getModelToken(Thread.name));
  const messageModel = app.get<Model<Message>>(getModelToken(Message.name));

  const expiredThreads = await threadModel
    .find({ expiresAt: { $lt: new Date() } })
    .exec();

  for (const thread of expiredThreads) {
    console.log(`Deleting expired thread: ${thread._id as string}`);
    await messageModel.deleteMany({ threadId: thread._id }).exec();
    await threadModel.findByIdAndDelete(thread._id).exec();
  }

  await app.close();
  console.log('Thread cleanup complete.');
}

cleanupThreads().catch((error) => {
  console.error('Error during thread cleanup:', error);
  process.exit(1);
});
