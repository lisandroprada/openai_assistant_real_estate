import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Thread extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Message' }])
  messages: MongooseSchema.Types.ObjectId[];

  @Prop({ required: true, index: { expires: '14d' } })
  expiresAt: Date;
}

export const ThreadSchema = SchemaFactory.createForClass(Thread);
