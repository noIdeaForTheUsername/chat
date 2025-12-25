import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserAuth } from './user-auth.interface';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserAuth = { id: request.user.sub };
    return user as UserAuth;
  },
);