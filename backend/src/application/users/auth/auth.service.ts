import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Transactional } from 'typeorm-transactional';
import { ProfilesDomainService } from 'src/domain/profiles/profiles.service';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class AuthService {

  constructor(
    private accountsService: AccountsDomainService,
    private profilesService: ProfilesDomainService,
    private jwtService: JwtService
  ) {}


  async register(login: string, plainPassword: string,
    emailPublic: boolean, phoneNumberPublic: boolean,
    email?: string, phoneNumber?: string,
    name?: string, bio?: string
  ) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    const id = await this.createUser(login, hashedPassword, email, phoneNumber,
      emailPublic, phoneNumberPublic, name, bio);

    return { authJwt: await this.jwtService.signAsync({ sub: id }) }
  }

  async login(account: string, plainPassword: string) {
    const found = await this.accountsService.findAccountByUniqueField(account);
    if (!found || !(await bcrypt.compare(plainPassword, found.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { authJwt: await this.jwtService.signAsync({ sub: found.id }) };
  }


  @Transactional()
  private async createUser(login: string, passwordHash: string,
    email?: string, phoneNumber?: string,
    emailPublic: boolean = false, phoneNumberPublic: boolean = false,
    name?: string, bio?: string
  ) {
    if (!email && !phoneNumber)
      throw new BadRequestException('Either email or phone number must be provided');

    // Create and return ID
    try {
      const newAccount = await this.accountsService.createAccount(login, passwordHash, email, phoneNumber);
      await this.profilesService.createProfile(newAccount.id, phoneNumberPublic,
        emailPublic, name, bio);
      return newAccount.id;
    } catch (err) {
      if (err instanceof QueryFailedError && err.driverError.code == "23505"){
        const constraint = err.driverError.constraint;
        switch (constraint) {
          case 'unique_login':
            throw new ConflictException('User with this login already exists');
          case 'unique_email':
            throw new ConflictException('User with this email already exists');
          case 'unique_phone_number':
            throw new ConflictException('User with this phone number already exists');
        }
      }
      throw err;
    }
  }
}
