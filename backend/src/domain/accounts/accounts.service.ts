import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Repository } from 'typeorm';
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

  async findByPhoneNumber(phoneNumber: string, exceptionOnNotFound = false) {
    return await this.accounts.findOneBy({ phoneNumber });
  }
  async findExistingByPhoneNumber(phoneNumber: string) {
    const found = await this.findByPhoneNumber(phoneNumber);
    if (!found)
      throw new NotFoundException('not-found.user');
    return found;
  }
  
  async findAdmins(activatedOnly: boolean = true) {
    let where: Record<string, boolean> = { admin: true };
    if (activatedOnly) where['activated'] = true;
    return await this.accounts.findBy(where);
  }

  async findUnactivatedAccounts() {
    return await this.accounts.findBy({ activated: false });
  }

  // CREATING

  async create(phoneNumber: string, passwordHash: string, activated: boolean) {
    const newAccount = this.accounts.create({
      phoneNumber,
      passwordHash,
      activated,
    });
    const created = await this.accounts.save(newAccount);
    return created;
  }

  // MODIFYING/DELETING DATA

  // Only for basic account data modifications and password changes, nothing regarding privileges
  async update(id: number, updatedFields: Partial<Account>) {
    updatedFields.id = undefined;  // prevent id change
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

  async changePassword(id: number, newPasswordHash: string) {
    const result = await this.accounts.update(
      { id },
      { passwordHash: newPasswordHash }
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
