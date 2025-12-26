import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AccountsService } from 'src/accounts/accounts.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(private accountsService: AccountsService, private jwtService: JwtService) {}
  
  async register(login: string, plainPassword: string, email?: string, phoneNumber?: string) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    const id = await this.accountsService.create(login, hashedPassword, email, phoneNumber);
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
