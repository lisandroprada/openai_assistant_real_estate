import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ThreadsModule } from './modules/threads/threads.module';
import { OpenaiModule } from './modules/openai/openai.module';
import { FunctionsModule } from './modules/functions/functions.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ThreadsModule,
    OpenaiModule,
    FunctionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
