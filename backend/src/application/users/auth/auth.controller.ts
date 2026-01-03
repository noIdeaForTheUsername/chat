import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Patch, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { PublicAccess } from 'src/shared/auth/public-access.decorator';
import { UserId } from 'src/shared/auth/user-id.decorator';
import { plainToInstance } from 'class-transformer';
import { AccountResponseDto } from './dto/account-response.dto';
import { ModifyAccountDto } from './dto/modify-account.dto';

@Controller("auth")
@PublicAccess(true)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

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

  @Get('me')
  @PublicAccess(false)
  async getCurrentUser(@UserId() userId: number) {
    const unsafe = await this.authService.getAccount(userId);
    return plainToInstance(AccountResponseDto, unsafe)
  }

  @Patch("me")
  @HttpCode(HttpStatus.NO_CONTENT)
  async modifyAccount(@UserId() userId: number, @Body() body: ModifyAccountDto): Promise<AccountResponseDto> {
    if (body.password !== body.passwordRepeat)
      throw new BadRequestException("passwords-different");

    if (!body.email) body.email = null;
    if (!body.phoneNumber) body.phoneNumber = null;

    return plainToInstance(
      AccountResponseDto,
      await this.authService.modifyAccount(userId, body)
    );
  }

  private sendJwtCookie(res: Response, jwt: string) {
    res.cookie('authJwt', jwt, { httpOnly: true, sameSite: 'strict' });
  }
}
