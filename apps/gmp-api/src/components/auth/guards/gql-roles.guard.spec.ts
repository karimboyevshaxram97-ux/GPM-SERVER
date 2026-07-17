import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../libs/enums';
import { GqlRolesGuard } from './gql-roles.guard';

const createContext = (user?: { role: UserRole }): ExecutionContext => {
  const handler = function handler() {};
  class Resolver {}

  return {
    getType: () => 'graphql',
    getHandler: () => handler,
    getClass: () => Resolver,
    getArgs: () => [undefined, undefined, { req: { user } }, undefined],
  } as unknown as ExecutionContext;
};

describe('GqlRolesGuard', () => {
  it('reads role metadata from both the resolver method and class', () => {
    const getAllAndOverride = jest.fn().mockReturnValue([UserRole.SUPER_ADMIN]);
    const reflector = {
      getAllAndOverride,
    } as unknown as Reflector;
    const context = createContext({ role: UserRole.SUPER_ADMIN });

    expect(new GqlRolesGuard(reflector).canActivate(context)).toBe(true);
    expect(getAllAndOverride).toHaveBeenCalledWith('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('rejects a regular user from a super-admin resolver', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.SUPER_ADMIN]),
    } as unknown as Reflector;

    expect(() =>
      new GqlRolesGuard(reflector).canActivate(
        createContext({ role: UserRole.USER }),
      ),
    ).toThrow(ForbiddenException);
  });
});
