import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterInput } from '../../libs/dto/auth/register.input';
import { UserService } from '../user/user.service';
import { AuthResponse } from '../../libs/dto/auth/auth-response.type';
import { LoginInput } from '../../libs/dto/auth/login.input';
import { RefreshTokenInput } from '../../libs/dto/auth/refresh-token.input';
import {
  AuthProvider,
  Message,
  SocialProfile,
  UserRole,
  UserStatus,
} from '../../libs';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const phoneNumber = input.phoneNumber.trim();
    const existing = await this.userService.findByPhone(phoneNumber);
    if (existing) throw new ConflictException(Message.ALREADY_EXISTS);

    const autoEmail = `${phoneNumber.replace(/\D/g, '')}@gmp.app`;
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const allowedRole =
      input.role === UserRole.AGENCY_ADMIN
        ? UserRole.AGENCY_ADMIN
        : UserRole.USER;
    const user = await this.userService.create({
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber,
      email: autoEmail,
      password: hashedPassword,
      role: allowedRole,
    } as any);

    const userObject = user.toObject ? user.toObject() : user;
    const refreshToken = this.generateRefreshToken(userObject);
    await this.userService.updateRefreshTokenHash(
      user._id.toString(),
      refreshToken,
    );

    return {
      accessToken: this.generateAccessToken(userObject),
      refreshToken,
      user: userObject as any,
    };
  }

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    const identifier = loginInput.phoneNumber.trim();
    let user = await this.userService.findByPhone(identifier, true);
    if (!user) user = await this.userService.findByEmail(identifier, true);
    if (!user) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

    if (user.status === UserStatus.BANNED)
      throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);

    if (!user.password)
      throw new UnauthorizedException(Message.LOGIN_WITH_SOCIAL);

    const passwordMatches = await bcrypt.compare(
      loginInput.password,
      user.password,
    );
    if (!passwordMatches)
      throw new UnauthorizedException(Message.WRONG_PASSWORD);

    await this.userService.updateLastLoginAt(user._id.toString());

    const userObject = user.toObject ? user.toObject() : user;
    const refreshToken = this.generateRefreshToken(userObject);
    await this.userService.updateRefreshTokenHash(
      user._id.toString(),
      refreshToken,
    );

    return {
      accessToken: this.generateAccessToken(userObject),
      refreshToken,
      user: userObject as any,
    };
  }

  async socialLogin(profile: SocialProfile): Promise<AuthResponse> {
    let user = await this.userService.findByProvider(
      profile.provider,
      profile.providerId,
    );

    if (user) {
      // Consent items may have been granted after the account was created
      user = await this.userService.refreshSocialProfile(user, profile);
    }

    if (!user && profile.email) {
      const byEmail = await this.userService.findByEmail(profile.email);
      if (byEmail) {
        // Linking is only safe onto a password account; an account already owned
        // by another social provider must keep its original login method.
        if (byEmail.authProvider !== AuthProvider.EMAIL) {
          throw new ConflictException(Message.EMAIL_USED_OTHER_PROVIDER);
        }
        user = await this.userService.linkSocialAccount(
          byEmail._id.toString(),
          profile,
        );
      }
    }

    if (!user) {
      user = await this.userService.createSocialUser(profile);
    }

    if (user.status === UserStatus.BANNED)
      throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);

    await this.userService.updateLastLoginAt(user._id.toString());

    const userObject = user.toObject ? user.toObject() : user;
    const refreshToken = this.generateRefreshToken(userObject);
    await this.userService.updateRefreshTokenHash(
      user._id.toString(),
      refreshToken,
    );

    return {
      accessToken: this.generateAccessToken(userObject),
      refreshToken,
      user: userObject as any,
    };
  }

  async refreshToken(input: RefreshTokenInput): Promise<AuthResponse> {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret)
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

    let payload: any;
    try {
      payload = this.jwtService.verify(input.refreshToken, {
        secret: refreshSecret,
      });
    } catch (err) {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }

    const user = await this.userService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }

    const tokenMatches = await bcrypt.compare(
      input.refreshToken,
      user.refreshTokenHash,
    );
    if (!tokenMatches) {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }

    const userObject = user.toObject ? user.toObject() : user;
    const refreshToken = this.generateRefreshToken(userObject);
    await this.userService.updateRefreshTokenHash(
      user._id.toString(),
      refreshToken,
    );

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
      const payload = this.jwtService.verify<{ sub: string }>(token);
      return this.userService.findById(payload.sub);
    } catch {
      return null;
    }
  }

  private generateAccessToken(user: any): string {
    return this.jwtService.sign({
      sub: user._id.toString(),
      _id: user._id.toString(),
      email: user.email ?? '',
      role: user.role,
      status: user.status,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      avatar: user.avatar ?? '',
      phoneNumber: user.phoneNumber ?? '',
      preferredLanguage: user.preferredLanguage ?? '',
    });
  }

  private generateRefreshToken(user: any): string {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret)
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '604800';

    return this.jwtService.sign({ sub: user._id.toString() }, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    } as any);
  }
}
