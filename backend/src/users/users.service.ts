import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Account } from './accounts/entities/account.entity';
import { Profile } from './profiles/entities/profile.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersService {

  constructor(
    private dataSource: DataSource,
    // @InjectRepository(Account)
    // private accounts: Repository<Account>,
    // @InjectRepository(Profile)
    // private profiles: Repository<Profile>,
  ) {}

  async createUser(login: string, passwordHash: string, email?: string, phoneNumber?: string,
    name?: string, bio?: string) {
    if (!email && !phoneNumber)
      throw new BadRequestException('Either email or phone number must be provided');

    // Create and return ID
    try {
      const id = await this.dataSource.transaction(async manager => {
        const account = manager.create(Account, { login, passwordHash, email, phoneNumber });
        const savedAccount = await manager.save(account);
        const profile = manager.create(Profile, { id: savedAccount.id, name, bio });
        await manager.save(profile);
        return savedAccount.id;
      });
      return id;
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
}
