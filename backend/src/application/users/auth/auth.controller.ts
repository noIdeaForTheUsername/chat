import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, InternalServerErrorException, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { plainToInstance } from 'class-transformer';
import type { Request, Response } from 'express';
import { Account } from 'src/domain/accounts/entities/account.entity';
import { UserAccount } from 'src/shared/auth/decorators/account.decorator';
import { PublicAccess } from 'src/shared/auth/decorators/public-access.decorator';
import { SENSITIVE_RATE_LIMIT } from 'src/shared/global-rate-limiting/rate-limiting-settings';
import { AccountResponseDto } from '../accounts/dto/account-response.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';


@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Get('me')
  async getCurrentUser(@UserAccount() account: Account) {
    return plainToInstance(AccountResponseDto, account);
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
    this.authService.logout(req, res);
  }

  @Post('global-logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle(SENSITIVE_RATE_LIMIT)
  async globalLogout(
    @Req() req: Request,
    @Body("password") password: string,
  ) {
    if (typeof password != 'string')
      throw new BadRequestException('password must be a string');
    
    await this.authService.globalLogoutWithPasswordCheck(
      req, password);
  }
}
