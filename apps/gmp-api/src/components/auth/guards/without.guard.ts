import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SetMetadata } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserService } from '../../user/user.service';

export const IS_WITHOUT_KEY = 'isWithout';
export const WithoutAuth = () => SetMetadata(IS_WITHOUT_KEY, true);

@Injectable()
export class WithoutGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    const { req } = gqlCtx.getContext();

    try {
      const token = this.extractToken(req);
      if (token) {
        const secret = this.configService.get<string>('jwt.secret') ?? 'super-secret-key-change-in-production';
        const payload = this.jwtService.verify<{ sub: string }>(token, { secret });
        const user = await this.userService.findById(payload.sub);
        req.user = user ? (user.toObject ? user.toObject() : user) : null;
      }
    } catch {}

    return true;
  }

  private extractToken(req: any): string | null {
    const authHeader = req.headers?.authorization;
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
