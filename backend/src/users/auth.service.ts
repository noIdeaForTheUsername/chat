import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountsService } from './accounts/accounts.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {

  constructor(
    private accountsService: AccountsService,
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}
  
  async register(login: string, plainPassword: string, email?: string, phoneNumber?: string,
    name?: string, bio?: string
  ) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    const id = await this.usersService.createUser(login, hashedPassword, email, phoneNumber, name, bio);

    return { authJwt: await this.jwtService.signAsync({ sub: id }) }
  }

  async login(account: string, plainPassword: string) {
    const found = await this.accountsService.findByUniqueField(account);
    if (!found || !(await bcrypt.compare(plainPassword, found.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { authJwt: await this.jwtService.signAsync({ sub: found.id }) };
  }
}
