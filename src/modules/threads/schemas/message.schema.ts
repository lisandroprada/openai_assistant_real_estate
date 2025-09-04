import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Thread', required: true })
  threadId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: ['user', 'assistant', 'function'] })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Object })
  functionCall: {
    name: string;
    arguments: object;
  };
}

export const MessageSchema = SchemaFactory.createForClass(Message);
