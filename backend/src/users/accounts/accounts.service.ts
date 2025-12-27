import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account) private accounts: Repository<Account>,
  ) {}

  async findById(id: number, exceptionOnNotFound = false) {
    const found = await this.accounts.findOneBy({ id });
    if (!found && exceptionOnNotFound)
      throw new NotFoundException('User not found');
    return found;
  }

  async findByLogin(login: string, exceptionOnNotFound = false) {
    const found = await this.accounts.findOneBy({ login });
    if (!found && exceptionOnNotFound)
      throw new NotFoundException('User not found');
    return found;
  }

  async findByUniqueField(loginOrEmailOrPhone: string) {
    return await this.accounts.findOne({
      where: [
        { login: loginOrEmailOrPhone },
        { email: loginOrEmailOrPhone },
        { phoneNumber: loginOrEmailOrPhone }
      ]
    });
  }

  async delete(id: number) {
    await this.accounts.delete({ id });
  }
}
