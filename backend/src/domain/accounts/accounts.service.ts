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

  async findById(id: number) {
    return await this.accounts.findOneBy({ id });
  }
  async findExistingById(id: number) {
    const found = await this.findById(id);
    if (!found)
      throw new NotFoundException('not-found.user');
    return found;
  }

  async findByLogin(login: string, exceptionOnNotFound = false) {
    return await this.accounts.findOneBy({ login });
  }
  async findExistingByLogin(login: string) {
    const found = await this.findByLogin(login);
    if (!found)
      throw new NotFoundException('not-found.user');
    return found;
  }

  async findByUniqueField(loginOrEmailOrPhone: string) {
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

  async findUnactivatedAccounts() {
    return await this.accounts.findBy({ activated: false });
  }

  // CREATING

  async create(login: string, passwordHash: string, email?: string, phoneNumber?: string) {
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

  // Only for basic account data modifications and password changes, nothing regarding privileges
  async update(id: number, updatedFields: Partial<Account>) {
    updatedFields.id = undefined;  // prevent id change
    updatedFields.login = undefined;  // prevent login change
    updatedFields.activated = undefined;  // prevent activation change
    updatedFields.admin = undefined;  // prevent privilege change

    await this.accounts.update(
      { id },
      updatedFields
    );
    
    const acc = await this.accounts.findOneBy({ id });
    if (!acc) throw new NotFoundException("not-found.account");
    return acc;
  }

  // (de)activate account
  async changeActivationStatus(id: number, activated: boolean) {
    const result = await this.accounts.update(
      { id },
      { activated: activated }
    );
    if (result.affected === 0) throw new NotFoundException("not-found.account");
  }
  
  async changeAdminStatus(id: number, isAdmin: boolean) {
    const result = await this.accounts.update(
      { id },
      { admin: isAdmin }
    );
    if (result.affected === 0) throw new NotFoundException("not-found.account");
  }

  async delete(id: number) {
    await this.accounts.delete({ id });
  }
}
