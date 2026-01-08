import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountsDomainService } from 'src/domain/accounts/accounts.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Transactional } from 'typeorm-transactional';
import { ProfilesDomainService } from 'src/domain/profiles/profiles.service';
import { QueryFailedError } from 'typeorm';
import { ModifyAccountDto } from './dto/modify-account.dto';
import { Account } from 'src/domain/accounts/entities/account.entity';
import { jwtSecret } from './jwt-constants';

@Injectable()
export class AuthService {

  private readonly bcryptSaltRounds = 12;

  constructor(
    private accountsService: AccountsDomainService,
    private profilesService: ProfilesDomainService,
    private jwtService: JwtService
  ) {
    // if (jwtSecret === undefined) {
    //   throw new Error("JWT_SECRET is not defined in environment variables");
    // }
  }


  async register(login: string, plainPassword: string,
    emailPublic: boolean, phoneNumberPublic: boolean,
    email?: string, phoneNumber?: string,
    name?: string, bio?: string
  ) {
    const hashedPassword = await bcrypt.hash(plainPassword, this.bcryptSaltRounds);

    const id = await this.createUser(login, hashedPassword, email, phoneNumber,
      emailPublic, phoneNumberPublic, name, bio);

    return { authJwt: await this.jwtService.signAsync({ sub: id }) }
  }

  async login(account: string, plainPassword: string) {
    const found = await this.accountsService.findAccountByUniqueField(account);
    if (!found || !(await bcrypt.compare(plainPassword, found.passwordHash))) {
      throw new UnauthorizedException('credentials-invalid');
    }
    return { sub: found.id, authJwt: await this.jwtService.signAsync({ sub: found.id }) };
  }

  async getFullProfile(userId: number) {
    return this.profilesService.findFullPublicProfile(userId, true);
  }


  @Transactional()
  private async createUser(login: string, passwordHash: string,
    email?: string, phoneNumber?: string,
    emailPublic: boolean = false, phoneNumberPublic: boolean = false,
    name?: string, bio?: string
  ) {
    if (!email && !phoneNumber)
      throw new BadRequestException('email-or-phone-required');

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
            throw new ConflictException('exists.login');
          case 'unique_email':
            throw new ConflictException('exists.email');
          case 'unique_phone_number':
            throw new ConflictException('exists.phone-number');
        }
      }
      throw err;
    }
  }

  async getAccount(callerId: number) {
    return await this.accountsService.findAccountById(callerId, true);
  }

  @Transactional()
  async modifyAccount(callerId: number, dto: ModifyAccountDto) {
    const found = await this.accountsService.findAccountById(callerId);
    if (!found || !(await bcrypt.compare(dto.currentPassword, found.passwordHash))) {
      throw new UnauthorizedException('credentials-invalid');
    }

    let body: Partial<Account> = {
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      passwordHash: undefined
    }

    if (dto.password) {
      let newPasswordHash = await bcrypt.hash(dto.password, this.bcryptSaltRounds);
      body.passwordHash = newPasswordHash;
    }

    const updated = await this.accountsService.updateAccount(callerId, body);
    if (!updated.email && !updated.phoneNumber)
      throw new BadRequestException("email-or-phone-required");
  }
}
