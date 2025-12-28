import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { PublicAccess } from 'src/shared/auth/public-access.decorator';

@Controller()
@PublicAccess()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    if (body.password !== body.passwordRepeat)
      throw new BadRequestException('Given passwords do not match');
    const { authJwt } = await this.authService.register(
      body.login, body.password,
      body.emailPublic, body.phoneNumberPublic,
      body.email, body.phoneNumber, body.name, body.bio,
    );
    this.sendJwtCookie(res, authJwt);
  }

  @Post('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { authJwt } = await this.authService.login(body.account, body.password);
    this.sendJwtCookie(res, authJwt);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Res({ passthrough: true }) res: Response) {
    this.sendJwtCookie(res, '');
  }

  private sendJwtCookie(res: Response, jwt: string) {
    res.cookie('authJwt', jwt, { httpOnly: true, sameSite: 'strict' });
  }
}
