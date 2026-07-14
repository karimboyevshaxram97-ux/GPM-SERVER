import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserService } from '../../user/user.service';
import { IS_WITHOUT_KEY } from './without.guard';
import { UserStatus } from '../../../libs/enums';

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

    const isWithout = this.reflector.getAllAndOverride<boolean>(
      IS_WITHOUT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const req =
      context.getType<string>() === 'graphql'
        ? GqlExecutionContext.create(context).getContext<{ req: any }>().req
        : context.switchToHttp().getRequest();
    const secret = this.configService.get<string>('jwt.secret');
    if (!secret)
      throw new UnauthorizedException('JWT secret is not configured');

    if (isWithout) {
      try {
        const token = this.extractToken(req);
        if (token) {
          const payload = this.jwtService.verify<{ sub: string }>(token, {
            secret,
          });
          const user = await this.userService.findById(payload.sub);
          const userObject = user
            ? user.toObject
              ? user.toObject()
              : user
            : null;
          req.user =
            userObject?.status === UserStatus.ACTIVE ? userObject : null;
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

    const userObject = user.toObject ? user.toObject() : user;
    if (userObject.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }

    req.user = userObject;
    return true;
  }

  private extractToken(req: any): string | null {
    const authHeader = req.headers?.authorization;
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
