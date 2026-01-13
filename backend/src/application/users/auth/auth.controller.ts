import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { PublicAccess } from 'src/shared/auth/public-access.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { plainToInstance } from 'class-transformer';
import { AccountResponseDto } from '../accounts/dto/account-response.dto';
import { UserId } from 'src/shared/auth/user-id.decorator';


@Controller("auth")
@PublicAccess(true)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService
  ) {}

  @Get('me')
  @PublicAccess(false)
  async getCurrentUser(@UserId() userId: number) {
    const unsafe = await this.authService.getCurrentUser(userId);
    return plainToInstance(AccountResponseDto, unsafe);
  }

  // AUTHENTICATION OPERATIONS

  @Post('register')
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    if (body.password !== body.passwordRepeat)
      throw new BadRequestException('passwords-different');
    const { authJwt } = await this.authService.register(
      body.login, body.password,
      body.emailPublic, body.phoneNumberPublic,
      body.email, body.phoneNumber, body.name, body.bio,
    );
    this.sendJwtCookie(res, authJwt);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { sub, authJwt } = await this.authService.login(body.account, body.password);
    this.sendJwtCookie(res, authJwt);
    return { id: sub };
  }
 
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Res({ passthrough: true }) res: Response) {
    this.sendJwtCookie(res, '');
  }

  private sendJwtCookie(res: Response, jwt: string) {
    res.cookie('authJwt', jwt, {
      httpOnly: this.config.get('cookies.httpOnly'),
      sameSite: this.config.get('cookies.sameSite'),
      secure: this.config.get('cookies.secure'),
      maxAge: this.config.get<number>('cookies.expire_ms'),
    });
  }
}
