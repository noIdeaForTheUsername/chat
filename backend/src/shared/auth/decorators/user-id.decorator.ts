import { createParamDecorator, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const id = request.session?.userId;
    if (!id)
      throw new HttpException(
        '',
        HttpStatus.UNAUTHORIZED,
        { cause: "WARNING: @UserId decorator did not find user ID in the request object.\
          Make sure that the endpoint is protected by the LoggedInGuard." },
      );
    return id;
  },
);