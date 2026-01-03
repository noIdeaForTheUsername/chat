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

  async findFullPublicProfile(id: number, exceptionOnNotFound = false) {
    const profile = await this.fullProfiles.findOneBy( { id } );
    if (!profile && exceptionOnNotFound)
      throw new NotFoundException('not-found.profile');
    return profile;
  }

  async findRawProfile(id: number, exceptionOnNotFound = false) {
    const profile = await this.profiles.findOneBy( { id } );
    if (!profile && exceptionOnNotFound)
      throw new NotFoundException('not-found.profile');
    return profile;
  }

  async findSearchedProfiles(search: string) {
    const loginSearch = normalizeLogin(search);
    const emailSearch = normalizeEmail(search);
    const nameSearch = normalizeName(search);
    const phoneNumberSearch = normalizePhone(search);
    return await this.fullProfiles.find({
      where: [
        { login: loginSearch },
        { name: nameSearch },
        { email: emailSearch },
        { phoneNumber: phoneNumberSearch },
      ]
    });
  }

  // CREATING DATA

  async createProfile(accountId: number, phoneNumberPublic: boolean, emailPublic: boolean,
    name?: string, bio?: string
  ) {
    const profile = this.profiles.create({
      id: accountId,
      phoneNumberPublic,
      emailPublic,
      name,
      bio
    });
    return await this.profiles.save(profile);
  }

  // UPDATING DATA

  async updateProfile(id: number, updatedFieldsObject: Partial<Profile>) {
    updatedFieldsObject.id = undefined;  // Prevent changing the ID
    // execute
    await this.profiles.update({ id }, updatedFieldsObject);

    const edited = await this.profiles.findOneBy({ id });
    if (!edited) throw new NotFoundException('not-found.profile');
    // console.log('Edited profile:', edited);
    return edited;
  }
}
