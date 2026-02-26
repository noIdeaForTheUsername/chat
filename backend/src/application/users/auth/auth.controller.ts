import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { PublicAccess } from 'src/shared/auth/decorators/public-access.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { plainToInstance } from 'class-transformer';
import { AccountResponseDto } from '../accounts/dto/account-response.dto';
import { UserId } from 'src/shared/auth/decorators/user-id.decorator';


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
  async register(@Body() body: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (body.password !== body.passwordRepeat)
      throw new BadRequestException('passwords-different');
    await this.authService.register(
      req,
      body.phoneNumber,
      body.password,
      body.name, body.bio,
    );
    // this.sendJwtCookie(res, authJwt);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginDto)
  {
    const id = await this.authService.login(req, body.phoneNumber, body.password);
    // this.sendJwtCookie(res, authJwt);
    return { id };
  }
 
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    this.authService.logout(req, res);
  }
}
