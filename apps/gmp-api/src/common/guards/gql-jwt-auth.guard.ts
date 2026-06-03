import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserService } from '../../modules/user/user.service';

@Injectable()
export class GqlJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();

    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const secret = this.configService.get<string>('jwt.secret') ?? 'super-secret-key-change-in-production';

    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

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
