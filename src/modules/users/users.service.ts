import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(name: string, clientId: string, email?: string, phoneNumber?: string): Promise<User> {
    const newUser = new this.userModel({ name, clientId, email, phoneNumber });
    return newUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findByClientId(clientId: string): Promise<User[]> {
    return this.userModel.find({ clientId }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async getClientUserCount(clientId: string): Promise<number> {
    return this.userModel.countDocuments({ clientId }).exec();
  }
}
