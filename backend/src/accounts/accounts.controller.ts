import { Controller, Post, Body, BadRequestException, Res, UnauthorizedException, UseGuards, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { AccountsService } from 'src/accounts/accounts.service';
import { UserId } from './verification/user-id.decorator';
import { PublicAccess } from './verification/public-access.decotaror';
import { PartialType } from '@nestjs/mapped-types';
import { plainToInstance } from 'class-transformer';
import { AccountResponseDto } from './dto/account-reponse.dto';

@Controller()
@PublicAccess()
export class AccountsController {
  constructor(private readonly authService: AuthService, private readonly accountsService: AccountsService) {}

  @Post("register")
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    // Verify that passwords match
    if (body.password !== body.passwordRepeat) 
      throw new BadRequestException('Given passwords do not match');
    
    const { authJwt } = await this.authService.register(body.login, body.password,
      body.email, body.phoneNumber);
    this.sendJwtCookie(res, authJwt);
  }

  @Post("login")
  @HttpCode(HttpStatus.NO_CONTENT)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { authJwt } = await this.authService.login(body.account, body.password);
    this.sendJwtCookie(res, authJwt);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Res({ passthrough: true }) res: Response) {
    this.sendJwtCookie(res, '');
  }

  @Get("me")
  @PublicAccess(false)
  async getCurrentUser(@UserId() userId: number) {
    const account = await this.accountsService.findById(userId, true);
    return plainToInstance(AccountResponseDto, account, { excludeExtraneousValues: true });
  }

  private sendJwtCookie(res: Response, jwt: string) {
    res.cookie('authJwt', jwt, { httpOnly: true, sameSite: 'strict' });
  }
} 
