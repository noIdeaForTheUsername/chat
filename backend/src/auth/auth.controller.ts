import { Controller, Post, Body, BadRequestException, Res, UnauthorizedException, UseGuards, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { LoggedIn } from './verification-helpers/logged-in.guard';
import { User } from './verification-helpers/user.decorator';
import type { UserAuth } from './verification-helpers/user-auth.interface';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly usersService: UsersService) {}

  @Post("register")
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    // Verify that passwords match
    if (body.password !== body.passwordRepeat) 
      throw new BadRequestException('Given passwords do not match');
    // Delete unwanted characters from phone number & validate
    if (body.phoneNumber) {
      body.phoneNumber = body.phoneNumber?.replaceAll(" ", "");
      body.phoneNumber = body.phoneNumber?.replaceAll("-", "");
      if (body.phoneNumber.length > 13) throw new BadRequestException('Phone number incorrect');
    }
    
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

  @Get("protected-action")
  @UseGuards(LoggedIn)
  async protectedAction(@User() user: UserAuth) {
    return { message: `Hello, user with ID ${user.id}! This is a protected action.` };
  }

  private sendJwtCookie(res: Response, jwt: string) {
    res.cookie('authJwt', jwt, { httpOnly: true, sameSite: 'strict' });
  }
} 
