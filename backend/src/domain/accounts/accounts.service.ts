import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { normalizeLogin } from 'src/shared/validation/normalize-login';
import { normalizeEmail } from 'src/shared/validation/normalize-email';
import { normalizePhone } from 'src/shared/validation/normalize-phone';

@Injectable()
export class AccountsDomainService {
  constructor(
    @InjectRepository(Account) private accounts: Repository<Account>,
  ) {}

  // GETTING DATA

  async findAccountById(id: number, exceptionOnNotFound = false) {
    const found = await this.accounts.findOneBy({ id });
    if (!found && exceptionOnNotFound)
      throw new NotFoundException('User not found');
    return found;
  }

  async findAccountByLogin(login: string, exceptionOnNotFound = false) {
    const found = await this.accounts.findOneBy({ login });
    if (!found && exceptionOnNotFound)
      throw new NotFoundException('User not found');
    return found;
  }

  async findAccountByUniqueField(loginOrEmailOrPhone: string) {
    const loginCheck = normalizeLogin(loginOrEmailOrPhone);
    const emailCheck = normalizeEmail(loginOrEmailOrPhone);
    const phoneNumberCheck = normalizePhone(loginOrEmailOrPhone);
    
    return await this.accounts.findOne({
      where: [
        { login: loginCheck },
        { email: emailCheck },
        { phoneNumber: phoneNumberCheck }
      ]
    });
  }

  // CREATING

  async createAccount(login: string, passwordHash: string, email?: string, phoneNumber?: string) {
    const newAccount = this.accounts.create({
      login,
      passwordHash,
      email,
      phoneNumber
    });
    const created = await this.accounts.save(newAccount);
    return created;
  }

  // MODIFYING/DELETING DATA

  async deleteAccount(id: number) {
    await this.accounts.delete({ id });
  }
}
