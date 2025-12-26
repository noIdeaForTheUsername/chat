import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account) private accounts: Repository<Account>,
  ) {}

  async create(login: string, passwordHash: string, email?: string, phoneNumber?: string) {
    if (!email && !phoneNumber)
      throw new BadRequestException('Either email or phone number must be provided');

    // Check for uniqueness
    // const loginRepeat = await this.accounts.findOneBy({ login });
    // if (loginRepeat) throw new ConflictException("User with this login already exists");
    // const emailRepeat = await this.accounts.findOneBy({ email });
    // if (emailRepeat) throw new ConflictException("User with this email already exists");
    // const phoneNumberRepeat = await this.accounts.findOneBy({ phoneNumber });
    // if (phoneNumberRepeat) throw new ConflictException("User with this phone number already exists");

    // Create and return ID
    try {
      const entity = this.accounts.create({ login, passwordHash, email, phoneNumber });
      const user = await this.accounts.save(entity);
      return user.id;
    } catch (err) {
      if (err instanceof QueryFailedError && err.driverError.code == "23505"){
        const contraint = err.driverError.constraint;
        switch (contraint) {
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
