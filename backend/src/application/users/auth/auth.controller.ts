import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, Session } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { PublicAccess } from 'src/shared/auth/decorators/public-access.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { plainToInstance } from 'class-transformer';
import { AccountResponseDto } from '../accounts/dto/account-response.dto';
import { UserId } from 'src/shared/auth/decorators/user-id.decorator';
import { SessionEntity } from 'src/domain/session/entity/session.entity';
import { Throttle } from '@nestjs/throttler';
import { SENSITIVE_RATE_LIMIT } from 'src/shared/global-rate-limiting/rate-limiting-settings';
import { RateLimitedAction } from 'src/application/actions-rate-limiting/rate-limited-action.interface';


@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService
  ) {}

  @Get('me')
  async getCurrentUser(@UserId() userId: number) {
    const unsafe = await this.authService.getCurrentUser(userId);
    return plainToInstance(AccountResponseDto, unsafe);
  }

  // AUTHENTICATION OPERATIONS

  @Post('register')
  @PublicAccess()
  @Throttle(SENSITIVE_RATE_LIMIT)
  async register(@Body() body: RegisterDto, @Req() req: Request) {
    if (body.password !== body.passwordRepeat)
      throw new BadRequestException('passwords-different');
    await this.authService.register(
      req,
      body.phoneNumber,
      body.password,
      body.name, body.bio,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @PublicAccess()
  @Throttle(SENSITIVE_RATE_LIMIT)
  async login(
    @Req() req: Request,
    @Body() body: LoginDto,
  ) {
    await this.authService.login(req, body.phoneNumber, body.password);
  }
 
  @Post('logout')
  @PublicAccess()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    console.log("LOGOUT!");
    this.authService.logout(req, res);
  }

  @Post('global-logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async globalLogout(@Session() session: SessionEntity) {
    await this.authService.globalLogout(session.userId, session.sid);
  }
}
