import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserKnownProfile } from './entities/user-known-profile.entity';
import { Like, Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { FullProfile } from './entities/full-profile.entity';
import { normalize } from 'path';
import { normalizePhone } from 'src/shared/validation/normalize-phone';
import { normalizeName } from 'src/shared/validation/normalize-name';
import { normalizeLogin } from 'src/shared/validation/normalize-login';
import { normalizeEmail } from 'src/shared/validation/normalize-email';

@Injectable()
export class ProfilesDomainService {
  constructor(
    @InjectRepository(UserKnownProfile)
    private userKnownProfiles: Repository<UserKnownProfile>,
    @InjectRepository(Profile)
    private profiles: Repository<Profile>,
    @InjectRepository(FullProfile)
    private fullProfiles: Repository<FullProfile>
  ) {}

  // GETTING DATA

  async findUserKnownProfiles(userId: number) {
    return await this.userKnownProfiles.findBy({ contactOwnerId: userId });
  }

  async findUserKnownProfile(userId: number, profileId: number, exceptionOnNotFound = false) {
    const profile = await this.userKnownProfiles.findOneBy({
      contactOwnerId: userId,
      id: profileId
    });
    if (!profile && exceptionOnNotFound)
      throw new NotFoundException('not-found.profile');
    return profile;
  }

  // Full profile includes email and phone number, that should never be exposed to anyone except the account owner
  async findFullProfile(id: number, exceptionOnNotFound = false) {
    const profile = await this.fullProfiles.findOneBy( { id } );
    if (!profile && exceptionOnNotFound)
      throw new NotFoundException('not-found.profile');
    return profile;
  }

  async findSearchedProfiles(search: string) {
    // const loginSearch = normalizeLogin(search);
    // const emailSearch = normalizeEmail(search);
    const nameSearch = normalizeName(search);
    const phoneNumberSearch = normalizePhone(search);

    const where = [];
    // Make sure only non-empty searches are added - discovery requires knowledge of the exact value
    // (and we really do NOT want to return anyone with some field empty as "known and discoverable")
    if (nameSearch.trim().length > 0)
      where.push({ name: nameSearch });
    if (phoneNumberSearch.trim().length > 0)
      where.push({ phoneNumber: phoneNumberSearch });

    if (where.length === 0) {
      // nothing valid to search for
      return [];
    }

    // Full profile includes email and phone number, that should never be exposed to anyone except the account owner
    return await this.fullProfiles.find({ where });
  }

  // CREATING DATA

  async createProfile(accountId: number, name?: string, bio?: string) {
    const profile = this.profiles.create({
      id: accountId,
      name,
      bio
    });
    return await this.profiles.save(profile);
  }

  // UPDATING DATA

  async updateProfile(id: number, updatedFieldsObject: Partial<Profile>) {
    updatedFieldsObject.id = undefined;  // Prevent changing the ID
    if (updatedFieldsObject === undefined || Object.keys(updatedFieldsObject).length === 0) {
      return;
    } 
    // execute
    const result = await this.profiles.update({ id }, updatedFieldsObject);

    if (result.affected === 0) throw new NotFoundException('not-found.profile');
  }
}
