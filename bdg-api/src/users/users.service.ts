import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create new user
    const newUser = new this.userModel({
      ...createUserDto,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      password: hashedPassword,
    });

    return newUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    // Remove password from update data if it exists
    if (updateData.password) {
      delete updateData.password;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async updatePassword(id: string, newPassword: string): Promise<User> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { password: hashedPassword }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return deletedUser;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      console.log(`Validating user with email: ${email}`);

      // Find user by email
      let user: User | null;
      try {
        user = await this.userModel.findOne({ email }).exec();
      } catch (dbError) {
        console.error('Database error when finding user:', dbError);
        return null;
      }

      // Check if user exists
      if (!user) {
        console.log(`User not found with email: ${email}`);
        return null;
      }

      // Check if user is active
      if (!user.isActive) {
        console.log(`User account is inactive: ${email}`);
        return null;
      }

      // Verify password
      let isPasswordValid;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        isPasswordValid = await bcrypt.compare(password, user.password);
      } catch (bcryptError) {
        console.error('Error comparing passwords:', bcryptError);
        return null;
      }

      if (!isPasswordValid) {
        console.log(`Invalid password for user: ${email}`);
        return null;
      }

      // Update last login time
      try {
        await this.userModel
          .findByIdAndUpdate(user._id, {
            lastLogin: new Date(),
          })
          .exec();
      } catch (updateError) {
        console.error('Error updating last login time:', updateError);
        // Continue anyway since authentication succeeded
      }

      console.log(`User validated successfully: ${email}`);
      return user;
    } catch (error) {
      console.error(`Unexpected error in validateUser for ${email}:`, error);
      return null;
    }
  }
}
