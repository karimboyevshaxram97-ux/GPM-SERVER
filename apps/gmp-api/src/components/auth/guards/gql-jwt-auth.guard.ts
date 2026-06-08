import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserService } from '../../user/user.service';
import { IS_WITHOUT_KEY } from './without.guard';

@Injectable()
export class GqlJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isWithout = this.reflector.getAllAndOverride<boolean>(IS_WITHOUT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();
    const secret = this.configService.get<string>('jwt.secret') ?? 'super-secret-key-change-in-production';

    if (isWithout) {
      try {
        const token = this.extractToken(req);
        if (token) {
          const payload = this.jwtService.verify<{ sub: string }>(token, { secret });
          const user = await this.userService.findById(payload.sub);
          req.user = user ? (user.toObject ? user.toObject() : user) : null;
        }
      } catch {}
      return true;
    }

    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('No token provided');

    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.userService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    req.user = user.toObject ? user.toObject() : user;
    return true;
  }

  private extractToken(req: any): string | null {
    const authHeader = req.headers?.authorization;
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
