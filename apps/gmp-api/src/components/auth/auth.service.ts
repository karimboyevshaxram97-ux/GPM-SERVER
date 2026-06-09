import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from '../../libs/dto/user/create-user.input';
import { UserService } from '../user/user.service';
import { AuthResponse } from '../../libs/dto/auth/auth-response.type';
import { LoginInput } from '../../libs/dto/auth/login.input';
import { RefreshTokenInput } from '../../libs/dto/auth/refresh-token.input';
import { Message } from '../../libs';

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
      throw new ConflictException(Message.USED_EMAIL);
    }

    const hashedPassword = await bcrypt.hash(createUserInput.password, 10);
    const user = await this.userService.create({
      ...createUserInput,
      email,
      password: hashedPassword,
    });

    const userObject = user.toObject ? user.toObject() : user;
    const refreshToken = this.generateRefreshToken(userObject);
    await this.userService.updateRefreshTokenHash(user._id.toString(), refreshToken);

    return {
      accessToken: this.generateAccessToken(userObject),
      refreshToken,
      user: userObject as any,
    };
  }

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    const email = loginInput.email.toLowerCase();
    const user = await this.userService.findByEmail(email, true);
    if (!user) {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }

    const passwordMatches = await bcrypt.compare(loginInput.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException(Message.WRONG_PASSWORD);
    }

    await this.userService.updateLastLoginAt(user._id.toString());

    const userObject = user.toObject ? user.toObject() : user;
    const refreshToken = this.generateRefreshToken(userObject);
    await this.userService.updateRefreshTokenHash(user._id.toString(), refreshToken);

    return {
      accessToken: this.generateAccessToken(userObject),
      refreshToken,
      user: userObject as any,
    };
  }

  async refreshToken(input: RefreshTokenInput): Promise<AuthResponse> {
    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ??
      'super-secret-refresh-key-change-in-production';

    let payload: any;
    try {
      payload = this.jwtService.verify(input.refreshToken, { secret: refreshSecret });
    } catch (err) {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }

    const user = await this.userService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }

    const tokenMatches = await bcrypt.compare(input.refreshToken, user.refreshTokenHash);
    if (!tokenMatches) {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }

    const userObject = user.toObject ? user.toObject() : user;
    const refreshToken = this.generateRefreshToken(userObject);
    await this.userService.updateRefreshTokenHash(user._id.toString(), refreshToken);

    return {
      accessToken: this.generateAccessToken(userObject),
      refreshToken,
      user: userObject as any,
    };
  }

  async logout(userId: string): Promise<boolean> {
    await this.userService.removeRefreshTokenHash(userId);
    return true;
  }

  async verifyToken(token: string): Promise<any | null> {
    try {
      const secret =
        this.configService.get<string>('jwt.secret') ?? 'super-secret-key-change-in-production';
      const payload = this.jwtService.verify<{ sub: string }>(token, { secret });
      return this.userService.findById(payload.sub);
    } catch {
      return null;
    }
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
