import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ type: String, required: true })
  clientId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, sparse: true }) // sparse index allows null values
  email?: string;

  @Prop({ type: String, sparse: true }) // sparse index allows null values
  phoneNumber?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ clientId: 1, email: 1 }, { unique: true, sparse: true });
UserSchema.index(
  { clientId: 1, phoneNumber: 1 },
  { unique: true, sparse: true },
);

UserSchema.pre('save', function (next) {
  if (!this.email && !this.phoneNumber) {
    next(new Error('Either email or phoneNumber must be provided.'));
  }
  next();
});
