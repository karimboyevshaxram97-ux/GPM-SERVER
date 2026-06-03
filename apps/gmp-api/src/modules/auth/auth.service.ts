import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from '../user/dto/create-user.input';
import { UserService } from '../user/user.service';
import { AuthResponse } from './dto/auth-response.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserInput: CreateUserInput): Promise<AuthResponse> {
    const email = createUserInput.email.toLowerCase();
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use.');
    }

    const hashedPassword = await bcrypt.hash(createUserInput.password, 10);
    const user = await this.userService.create({
      ...createUserInput,
      email,
      password: hashedPassword,
    });

    const userObject = user.toObject ? user.toObject() : user;

    return {
      accessToken: this.generateAccessToken(userObject),
      refreshToken: this.generateRefreshToken(userObject),
      user: userObject as any,
    };
  }

  private generateAccessToken(user: any): string {
    const secret = this.configService.get<string>('jwt.secret') ?? 'super-secret-key-change-in-production';
    const expiresIn = this.configService.get<string>('jwt.expiresIn') ?? '3600';
    const signOptions = {
      secret,
      expiresIn,
    } as any;

    return this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      signOptions,
    );
  }

  private generateRefreshToken(user: any): string {
    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ??
      'super-secret-refresh-key-change-in-production';
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ??
      '604800';
    const signOptions = {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    } as any;

    return this.jwtService.sign(
      {
        sub: user._id.toString(),
      },
      signOptions,
    );
  }
}
