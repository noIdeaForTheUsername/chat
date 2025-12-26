import { createParamDecorator, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.sub;
    // if (!userId)
    //   throw new HttpException(
    //     'Invalid authentication token',
    //     HttpStatus.UNAUTHORIZED,
    //     { cause: "WARNING: @UserId decorator did not find user ID in the request object.\
    //       Make sure that the endpoint is protected by the LoggedInGuard." },
    //   );
  },
);